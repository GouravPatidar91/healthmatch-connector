import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      title, 
      message, 
      type = 'marketing', 
      targetAudience = 'all',
      isAiGenerated = false,
      aiPrompt = null,
      createdBy = null,
      userIds: userIdsInput = null,
      personalize = false,
      imageUrl = null,
    } = await req.json();

    console.log('Broadcasting notification:', { title, type, targetAudience, isAiGenerated });

    if (!title || !message) {
      return new Response(
        JSON.stringify({ error: 'Title and message are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use service role key to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Create broadcast record first
    const { data: broadcast, error: broadcastError } = await supabaseAdmin
      .from('admin_broadcast_notifications')
      .insert({
        title,
        message,
        type,
        target_audience: targetAudience,
        is_ai_generated: isAiGenerated,
        ai_prompt: aiPrompt,
        created_by: createdBy,
        status: 'sending',
      })
      .select()
      .single();

    if (broadcastError) {
      console.error('Error creating broadcast record:', broadcastError);
      throw broadcastError;
    }

    console.log('Created broadcast record:', broadcast.id);

    // Get user IDs based on target audience - using service role bypasses RLS
    let userIds: string[] = [];

    if (Array.isArray(userIdsInput) && userIdsInput.length > 0) {
      userIds = [...new Set(userIdsInput.filter((id: any) => typeof id === 'string'))];
      console.log(`Using ${userIds.length} explicit user IDs`);
    } else if (targetAudience === 'active_users') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: activeUsers, error: activeError } = await supabaseAdmin
        .from('health_checks')
        .select('user_id')
        .gte('created_at', thirtyDaysAgo.toISOString());

      if (activeError) {
        console.error('Error fetching active users:', activeError);
        throw activeError;
      }

      userIds = [...new Set(activeUsers?.map(u => u.user_id) || [])];
      console.log(`Found ${userIds.length} active users`);
    } else {
      const { data: allUsers, error: usersError } = await supabaseAdmin
        .from('profiles')
        .select('id');

      if (usersError) {
        console.error('Error fetching all users:', usersError);
        throw usersError;
      }

      userIds = allUsers?.map(u => u.id) || [];
      console.log(`Found ${userIds.length} total users`);
    }

    if (userIds.length === 0) {
      console.log('No users found to notify');
      
      // Update broadcast as sent with 0 recipients
      await supabaseAdmin
        .from('admin_broadcast_notifications')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          recipients_count: 0,
        })
        .eq('id', broadcast.id);

      return new Response(
        JSON.stringify({ 
          success: true, 
          recipientsCount: 0,
          broadcastId: broadcast.id,
          message: 'No users found to notify'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Optionally fetch profiles for personalization
    let profileMap = new Map<string, { first_name: string | null; last_name: string | null }>();
    if (personalize) {
      const { data: profs } = await supabaseAdmin
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', userIds);
      (profs || []).forEach((p: any) => profileMap.set(p.id, { first_name: p.first_name, last_name: p.last_name }));
    }

    const applyTokens = (text: string, p?: { first_name: string | null; last_name: string | null }) =>
      text
        .split('{first_name}').join(p?.first_name?.trim() || 'there')
        .split('{last_name}').join(p?.last_name?.trim() || '');

    const notifications = userIds.map(userId => {
      const p = profileMap.get(userId);
      return {
        user_id: userId,
        type,
        title: personalize ? applyTokens(title, p) : title,
        message: personalize ? applyTokens(message, p) : message,
        notification_category: type,
        priority: 'normal',
        broadcast_id: broadcast.id,
        metadata: { 
          broadcast_id: broadcast.id, 
          ai_generated: isAiGenerated 
        },
      };
    });

    console.log(`Creating ${notifications.length} notifications...`);

    // Batch insert - Supabase handles large arrays efficiently
    const { error: insertError } = await supabaseAdmin
      .from('customer_notifications')
      .insert(notifications);

    if (insertError) {
      console.error('Error inserting notifications:', insertError);
      
      // Update broadcast as failed
      await supabaseAdmin
        .from('admin_broadcast_notifications')
        .update({ status: 'failed' })
        .eq('id', broadcast.id);
      
      throw insertError;
    }

    // Update broadcast with success status and count
    const { error: updateError } = await supabaseAdmin
      .from('admin_broadcast_notifications')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        recipients_count: notifications.length,
      })
      .eq('id', broadcast.id);

    if (updateError) {
      console.error('Error updating broadcast status:', updateError);
    }

    console.log(`Successfully sent notifications to ${notifications.length} users`);

    return new Response(
      JSON.stringify({
        success: true,
        recipientsCount: notifications.length,
        broadcastId: broadcast.id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Broadcast notification error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to broadcast notification' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
