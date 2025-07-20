
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      symptoms, 
      severity, 
      duration, 
      height, 
      weight, 
      symptomDetails, 
      previousConditions, 
      medications, 
      notes,
      analysisInstructions,
      symptomCategories  // New field to receive symptom category mapping
    } = await req.json();

    if (!symptoms || symptoms.length === 0) {
      return new Response(
        JSON.stringify({ error: "No symptoms provided" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Gemini API key not configured" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Enhanced symptom categorization with medical specialty mapping
    const symptomsText = symptoms.join(", ");
    const severityInfo = severity ? `Symptom severity: ${severity}` : "";
    const durationInfo = duration ? `Duration: ${duration}` : "";
    
    // Create symptom-to-category mapping for contextual analysis
    let symptomCategoryMapping = "";
    if (symptomCategories && symptomCategories.length > 0) {
      symptomCategoryMapping = `
SYMPTOM CATEGORY CONTEXT FOR ACCURATE DIAGNOSIS:
${symptomCategories.map(cat => `
${cat.category.toUpperCase()} SYMPTOMS: ${cat.symptoms.join(", ")}
`).join("")}

CRITICAL DIAGNOSTIC CONSTRAINT:
- Symptoms MUST be analyzed within their designated medical specialty context
- For DENTAL symptoms: Focus on oral, maxillofacial, and dental pathology ONLY
- For EYE symptoms: Focus on ophthalmological conditions ONLY  
- For SKIN symptoms: Focus on dermatological conditions ONLY
- Do NOT provide diagnoses outside the symptom's medical specialty domain
- Example: "Braces pain" (Dental category) should yield orthodontic/dental diagnoses, NOT neurological conditions like Brachial Neuritis
`;
    }

    // Comprehensive BMI and anthropometric assessment
    let clinicalAssessment = "";
    if (height && weight) {
      const heightInMeters = height / 100;
      const bmi = weight / (heightInMeters * heightInMeters);
      let bmiCategory = "";
      let healthRisks = [];
      
      if (bmi < 18.5) {
        bmiCategory = "Underweight";
        healthRisks = ["malnutrition", "immune deficiency", "osteoporosis risk"];
      } else if (bmi < 25) {
        bmiCategory = "Normal weight";
        healthRisks = ["minimal weight-related risks"];
      } else if (bmi < 30) {
        bmiCategory = "Overweight";
        healthRisks = ["cardiovascular risk", "diabetes risk", "hypertension risk"];
      } else {
        bmiCategory = "Obese";
        healthRisks = ["high cardiovascular risk", "diabetes", "sleep apnea", "joint problems"];
      }
      
      clinicalAssessment = `
ANTHROPOMETRIC CLINICAL ASSESSMENT:
- Height: ${height}cm, Weight: ${weight}kg
- BMI: ${bmi.toFixed(1)} (${bmiCategory})
- Associated Health Risks: ${healthRisks.join(", ")}
- Metabolic implications for symptom manifestation and treatment response
`;
    }
    
    // Comprehensive medical history integration
    let medicalHistoryAnalysis = "";
    if (previousConditions && previousConditions.length > 0) {
      medicalHistoryAnalysis = `
MEDICAL HISTORY INTEGRATION:
Previous Conditions: ${previousConditions.join(", ")}

CLINICAL SIGNIFICANCE:
- Analyze comorbidity interactions with current symptoms
- Evaluate disease progression patterns
- Consider chronic disease exacerbations
- Assess multi-system involvement
- Identify potential disease complications
`;
    }
    
    // Advanced pharmacological analysis
    let pharmacologicalAssessment = "";
    if (medications && medications.length > 0) {
      pharmacologicalAssessment = `
PHARMACOLOGICAL ASSESSMENT:
Current Medications: ${medications.join(", ")}

DRUG-SYMPTOM CORRELATION ANALYSIS:
- Evaluate medication side effects vs. disease symptoms
- Assess drug-drug interactions affecting symptom presentation
- Consider therapeutic drug monitoring needs
- Analyze medication adherence impact on symptoms
- Evaluate contraindications for potential treatments
`;
    }
    
    // Clinical notes integration
    let clinicalNotesAnalysis = "";
    if (notes && notes.trim()) {
      clinicalNotesAnalysis = `
ADDITIONAL CLINICAL CONTEXT:
${notes}

CONTEXTUAL ANALYSIS:
- Integrate patient-reported observations
- Consider social determinants of health
- Evaluate functional impact of symptoms
- Assess quality of life implications
`;
    }

    // Advanced visual diagnostic analysis with specialty focus
    let visualDiagnosticAnalysis = "";
    let diagnosticCategories = [];
    
    if (symptomDetails && symptomDetails.some(s => s.photo)) {
      visualDiagnosticAnalysis = "COMPREHENSIVE VISUAL DIAGNOSTIC ANALYSIS:\n";
      
      // Systematic visual examination by specialty with category constraints
      const eyeSymptoms = symptomDetails.filter(s => s.photo && isEyeSymptom(s.name));
      const skinSymptoms = symptomDetails.filter(s => s.photo && isSkinSymptom(s.name));
      const dentalSymptoms = symptomDetails.filter(s => s.photo && isDentalSymptom(s.name));
      
      if (eyeSymptoms.length > 0) {
        visualDiagnosticAnalysis += `
OPHTHALMOLOGICAL EXAMINATION:
Symptoms with visual documentation: ${eyeSymptoms.map(s => s.name).join(", ")}

SYSTEMATIC OCULAR ASSESSMENT:
• Anterior segment evaluation (conjunctiva, cornea, iris, lens)
• Posterior segment considerations (retina, optic nerve, vitreous)
• Pupillary light reflex and accommodation
• Extraocular muscle function and alignment
• Intraocular pressure implications
• Visual field defect patterns
• Color vision and contrast sensitivity
• Tear film stability and dry eye assessment

DIFFERENTIAL DIAGNOSTIC APPROACH:
• Infectious: bacterial, viral, fungal, parasitic
• Inflammatory: autoimmune, allergic, idiopathic
• Neoplastic: benign and malignant lesions
• Traumatic: mechanical, chemical, thermal
• Degenerative: age-related, hereditary
• Vascular: ischemic, hemorrhagic, embolic
`;
        diagnosticCategories.push("ophthalmological_examination");
      }
      
      if (skinSymptoms.length > 0) {
        visualDiagnosticAnalysis += `
DERMATOLOGICAL EXAMINATION:
Symptoms with visual documentation: ${skinSymptoms.map(s => s.name).join(", ")}

SYSTEMATIC SKIN ASSESSMENT:
• Primary lesion morphology (macule, papule, plaque, nodule, vesicle, bulla)
• Secondary changes (scale, crust, erosion, ulceration, atrophy, scarring)
• Color analysis (erythema, hyperpigmentation, hypopigmentation, cyanosis)
• Distribution patterns (localized, generalized, symmetric, unilateral, dermatomal)
• Border characteristics (well-demarcated, irregular, raised, flat)
• Surface texture (smooth, rough, verrucous, keratotic)
• Associated signs (warmth, tenderness, induration, fluctuation)

DERMATOLOGICAL DIAGNOSTIC FRAMEWORK:
• Inflammatory: eczematous, psoriasiform, lichenoid
• Infectious: bacterial, viral, fungal, parasitic
• Neoplastic: benign, premalignant, malignant
• Autoimmune: connective tissue disorders, bullous diseases
• Metabolic: diabetes, thyroid, nutritional deficiencies
• Drug-induced: fixed drug eruptions, photosensitivity
`;
        diagnosticCategories.push("dermatological_examination");
      }
      
      if (dentalSymptoms.length > 0) {
        visualDiagnosticAnalysis += `
COMPREHENSIVE ORAL AND MAXILLOFACIAL EXAMINATION:
Symptoms with visual documentation: ${dentalSymptoms.map(s => s.name).join(", ")}

SYSTEMATIC ORAL ASSESSMENT:
• Hard tissue evaluation (enamel, dentin, pulp, cementum)
• Periodontal assessment (gingiva, periodontal ligament, alveolar bone)
• Occlusal analysis (centric relation, maximum intercuspation)
• Temporomandibular joint evaluation (clicking, crepitus, deviation)
• Oral mucosal examination (buccal, lingual, palatal, floor of mouth)
• Salivary gland function (quantity, quality, pH)
• Lymph node palpation (cervical, submandibular, submental)

DENTAL DIAGNOSTIC METHODOLOGY:
• Caries assessment: ICDAS criteria, risk factors
• Periodontal classification: 2017 World Workshop staging/grading
• Endodontic evaluation: pulp vitality, periapical pathology
• Oral pathology: benign, premalignant, malignant lesions
• Orthodontic analysis: skeletal, dental, functional relationships
• Prosthodontic considerations: missing teeth, occlusal stability
`;
        diagnosticCategories.push("oral_maxillofacial_examination");
      }
    }

    // Specialized dental analysis requirements
    const requiresDentalSpecialization = analysisInstructions?.specialFocus === 'dental';
    const dentalSymptomsList = analysisInstructions?.dentalSymptoms || [];

    // Enhanced medical reasoning prompt with category-constrained diagnosis
    const medicalReasoningPrompt = `
You are an advanced AI medical diagnostic system implementing evidence-based medicine principles with systematic clinical reasoning for 90%+ diagnostic accuracy.

PATIENT CLINICAL PRESENTATION:
PRIMARY SYMPTOMS: ${symptomsText}
${severityInfo}
${durationInfo}
${symptomCategoryMapping}
${clinicalAssessment}
${visualDiagnosticAnalysis}
${medicalHistoryAnalysis}
${pharmacologicalAssessment}
${clinicalNotesAnalysis}

${requiresDentalSpecialization ? `
SPECIALIZED DENTAL DIAGNOSTIC REQUIREMENTS:
Dental symptoms requiring analysis: ${dentalSymptomsList.join(", ")}

ADVANCED DENTAL DIAGNOSTIC PROTOCOL:
• Apply evidence-based dental diagnostic criteria
• Utilize systematic oral examination findings
• Implement differential diagnosis methodology
• Consider multifactorial etiology in oral diseases
• Evaluate systemic-oral health correlations
• Apply current dental classification systems
• Consider age-specific dental pathology
• Assess treatment complexity and prognosis
` : ''}

CRITICAL DIAGNOSTIC CONSTRAINTS FOR ACCURACY:
1. SYMPTOM-CATEGORY ADHERENCE: Each symptom MUST be analyzed within its designated medical specialty
2. SCOPE LIMITATION: Do NOT provide diagnoses outside the symptom's medical domain
3. SPECIALTY FOCUS: 
   - Dental symptoms → Dental/Oral conditions only
   - Eye symptoms → Ophthalmological conditions only
   - Skin symptoms → Dermatological conditions only
   - General symptoms → Appropriate internal medicine conditions

SYSTEMATIC MEDICAL REASONING PROTOCOL:

1. CATEGORY-CONSTRAINED CLINICAL DATA SYNTHESIS:
   - Integrate all provided clinical information within appropriate medical specialties
   - Identify symptom clusters and syndromes within their respective domains
   - Analyze temporal relationships and progression within specialty constraints
   - Evaluate severity and functional impact specific to the medical specialty

2. SPECIALTY-SPECIFIC DIFFERENTIAL DIAGNOSIS FRAMEWORK:
   - Generate comprehensive differential diagnosis list WITHIN the appropriate medical specialty
   - Apply Bayesian diagnostic reasoning constrained to relevant medical domain
   - Consider epidemiological factors specific to the symptom category
   - Evaluate risk factors and predisposing conditions within the medical specialty
   - Rule out red flag conditions within the appropriate domain

3. DOMAIN-SPECIFIC EVIDENCE-BASED ANALYSIS:
   - Apply clinical decision rules specific to the medical specialty
   - Use validated diagnostic criteria for the relevant medical domain
   - Consider sensitivity and specificity within the specialty context
   - Evaluate positive and negative predictive values for specialty-specific conditions
   - Integrate current medical literature evidence from the appropriate field

4. SPECIALTY-FOCUSED PATHOPHYSIOLOGICAL CORRELATION:
   - Explain underlying disease mechanisms within the medical specialty
   - Correlate symptoms with anatomical and physiological processes specific to the domain
   - Analyze multi-system interactions when appropriate to the specialty
   - Consider genetic and environmental factors relevant to the medical field

5. CATEGORY-AWARE DIAGNOSTIC CONFIDENCE ASSESSMENT:
   - Calculate diagnostic probability scores within the medical specialty
   - Identify key discriminating features specific to the domain
   - Assess diagnostic certainty levels for specialty-specific conditions
   - Recommend confirmatory investigations appropriate to the medical field

6. SPECIALTY-CONSTRAINED CLINICAL DECISION MAKING:
   - Prioritize diagnoses by likelihood and urgency within the medical domain
   - Consider treatment implications and contraindications specific to the specialty
   - Evaluate prognosis and natural history within the medical field
   - Plan appropriate follow-up and monitoring for the specific specialty

EXAMPLES OF CORRECT CATEGORY-CONSTRAINED DIAGNOSIS:
- "Braces pain" (Dental category) → Orthodontic discomfort, dental malocclusion, periodontal inflammation
- "Eye redness" (Eye category) → Conjunctivitis, dry eye syndrome, allergic reaction
- "Rash" (Skin category) → Dermatitis, allergic reaction, fungal infection

INCORRECT DIAGNOSES TO AVOID:
- "Braces pain" should NOT yield: Brachial Neuritis, Tendinitis, Neurological conditions
- "Eye strain" should NOT yield: Cardiovascular conditions, Respiratory issues
- "Dental pain" should NOT yield: Cardiac conditions, Gastrointestinal disorders

REQUIRED COMPREHENSIVE OUTPUT FORMAT:
For each potential diagnosis, provide detailed analysis including:

{
  "medicalReasoningAnalysis": {
    "systematicApproach": "Description of category-constrained diagnostic methodology used",
    "clinicalSynthesis": "Integration of clinical data within appropriate medical specialty",
    "differentialProcess": "Step-by-step differential diagnosis reasoning within medical domain",
    "categoryConstraintCompliance": "Confirmation that diagnoses are within appropriate medical specialty"
  },
  "conditions": [
    {
      "name": "Primary Diagnosis (within appropriate medical specialty)",
      "medicalSpecialty": "Specific medical specialty domain (e.g., Dentistry, Ophthalmology, Dermatology)",
      "categoryContext": "Symptom category that led to this diagnosis",
      "icd10Code": "Appropriate ICD-10 classification within the medical specialty",
      "diagnosticConfidence": "90-95% (High/Very High) within specialty domain",
      "pathophysiology": "Detailed disease mechanism explanation within medical specialty",
      "clinicalReasoning": "Evidence-based diagnostic reasoning constrained to medical domain",
      "symptomCorrelation": "Detailed symptom-disease correlation within specialty",
      "specialtySpecificDifferentialDiagnosis": ["Alternative diagnoses within same medical specialty"],
      "riskStratification": "Low/Moderate/High risk assessment within specialty context",
      "diagnosticCriteria": "Specific criteria met for diagnosis within medical domain",
      "evidenceLevel": "Quality of supporting evidence within medical specialty",
      "matchedSymptoms": ["symptom1", "symptom2"],
      "unmatchedSymptoms": ["symptoms not explained by this specialty-specific diagnosis"],
      "diagnosticScore": 92,
      "clinicalPearls": ["Key diagnostic insights within medical specialty"],
      "redFlags": ["Warning signs requiring urgent attention within specialty"],
      "investigationsRecommended": ["Specific tests for confirmation within medical domain"],
      "treatmentConsiderations": "Evidence-based treatment approach within specialty",
      "contraindications": ["Treatment contraindications specific to medical field"],
      "prognosis": "Expected clinical course and outcomes within specialty context",
      "complications": ["Potential complications to monitor within medical domain"],
      "followUpProtocol": "Specific monitoring timeline for the medical specialty",
      "patientEducation": ["Key educational points specific to medical condition"],
      "preventiveStrategies": ["Prevention recommendations within medical specialty"],
      ${diagnosticCategories.length > 0 ? '"visualFindings": "Integration of visual diagnostic findings within specialty",' : ''}
      "medicalHistoryRelevance": "Impact of previous conditions on current specialty diagnosis",
      "pharmacologicalConsiderations": "Drug interactions and adjustments within specialty context",
      "specialtyReferralRecommendation": "Specific medical specialist referral if needed"
    }
  ],
  "overallClinicalAssessment": {
    "primaryWorkingDiagnosis": "Most likely diagnosis with confidence level within appropriate specialty",
    "diagnosticCertainty": "Overall confidence percentage (85-95%) within medical domain",
    "clinicalComplexity": "Simple/Moderate/Complex case assessment within specialty",
    "urgencyClassification": "Low/Moderate/High/Emergency within medical context",
    "systematicReviewFindings": "Review of systems implications within specialty",
    "riskBenefitAnalysis": "Treatment vs. observation considerations within medical domain",
    "categoryConstraintVerification": "Confirmation that all diagnoses are within appropriate medical specialties"
  },
  "qualityMetrics": {
    "diagnosticAccuracy": "Estimated accuracy percentage within specialty domain",
    "evidenceGrade": "A/B/C quality of evidence within medical specialty",
    "consensusLevel": "Professional consensus strength within medical field",
    "guidelineCompliance": "Adherence to clinical guidelines specific to medical specialty",
    "categoryAppropriatenessScore": "Score (1-10) for how well diagnoses match symptom categories"
  },
  ${requiresDentalSpecialization ? `
  "dentalSpecialistAnalysis": {
    "specialtyRecommendation": "Specific dental specialty referral",
    "urgencyLevel": "Routine/Urgent/Emergency dental care",
    "treatmentComplexity": "Simple/Moderate/Complex dental treatment",
    "interdisciplinaryNeeds": "Medical-dental collaborative care requirements",
    "dentalSpecialtyFocus": "Confirmation of dental-only diagnosis scope"
  },
  ` : ''}
  "clinicalDecisionSupport": {
    "immediateActions": ["Actions requiring immediate attention within specialty"],
    "shortTermManagement": ["Management within 1-7 days specific to medical domain"],
    "longTermPlan": ["Long-term management strategy within specialty"],
    "monitoringParameters": ["Specific parameters to track within medical field"],
    "patientSafetyConsiderations": ["Safety measures and precautions within specialty context"],
    "specialtyConstraintCompliance": "Verification that all recommendations are within appropriate medical domains"
  }
}

CRITICAL REQUIREMENTS:
- Provide 85-95% diagnostic accuracy through systematic reasoning WITHIN APPROPRIATE MEDICAL SPECIALTIES
- Include detailed pathophysiological explanations CONSTRAINED TO RELEVANT MEDICAL DOMAINS
- Correlate ALL symptoms with proposed diagnoses WITHIN THEIR RESPECTIVE CATEGORIES
- Apply evidence-based medicine principles SPECIFIC TO EACH MEDICAL SPECIALTY
- Consider patient safety as highest priority WITHIN SPECIALTY CONTEXT
- Return ONLY valid JSON format
- Maintain clinical professional standards WITHIN APPROPRIATE MEDICAL DOMAINS
- ABSOLUTELY ENSURE all diagnoses are within the appropriate medical specialty for each symptom
`;

    console.log("Initiating category-constrained advanced medical reasoning analysis with Gemini AI");
    console.log("Diagnostic approach:", requiresDentalSpecialization ? "Specialized Dental Medicine" : "General Internal Medicine with Category Constraints");
    console.log("Symptoms for analysis:", symptomsText);
    console.log("Category constraints active:", !!symptomCategoryMapping);
    console.log("Clinical complexity factors:", {
      medicalHistory: !!(previousConditions && previousConditions.length > 0),
      medications: !!(medications && medications.length > 0),
      visualData: diagnosticCategories.length > 0,
      anthropometrics: !!(height && weight),
      categoryMapping: !!symptomCategoryMapping
    });

    // Enhanced Gemini API call with category-constrained medical reasoning
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: medicalReasoningPrompt
          }]
        }],
        generationConfig: {
          temperature: 0.05, // Very low temperature for consistent medical reasoning
          topK: 20,
          topP: 0.9,
          maxOutputTokens: 6000,
          responseMimeType: "application/json"
        },
        systemInstruction: {
          parts: [{
            text: 'You are an expert medical AI system with advanced clinical reasoning capabilities and strict adherence to medical specialty domains. Apply systematic diagnostic methodology, evidence-based medicine principles, and comprehensive patient assessment for maximum diagnostic accuracy WITHIN APPROPRIATE MEDICAL SPECIALTIES. Each symptom must be analyzed within its designated medical specialty context. Prioritize patient safety and clinical precision while maintaining strict category constraints. Always provide detailed medical reasoning within the appropriate medical domain and maintain the highest professional medical standards specific to each medical specialty.'
          }]
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_MEDICAL",
            threshold: "BLOCK_NONE"
          }
        ]
      }),
    });

    if (!response.ok) {
      const errorDetails = await response.text();
      console.error("Gemini medical reasoning API error:", errorDetails);
      throw new Error(`Gemini API error: ${response.status} - ${errorDetails}`);
    }

    const data = await response.json();
    console.log("Received category-constrained comprehensive medical reasoning analysis from Gemini");
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0]) {
      console.error("Invalid Gemini response structure:", JSON.stringify(data));
      throw new Error("Invalid response structure from Gemini API");
    }

    const aiResponse = data.candidates[0].content.parts[0].text;
    
    try {
      const medicalAnalysisResult = JSON.parse(aiResponse);
      
      if (!medicalAnalysisResult.conditions || !Array.isArray(medicalAnalysisResult.conditions)) {
        throw new Error("Medical analysis missing required 'conditions' array");
      }
      
      // Enhanced analysis metadata with category-constrained medical reasoning indicators
      medicalAnalysisResult.advancedMedicalReasoning = true;
      medicalAnalysisResult.categoryConstrainedAnalysis = true;
      medicalAnalysisResult.systematicDiagnosticApproach = true;
      medicalAnalysisResult.evidenceBasedAnalysis = true;
      medicalAnalysisResult.highAccuracyAnalysis = true;
      medicalAnalysisResult.specialtyFocusedDiagnosis = true;
      medicalAnalysisResult.analysisTimestamp = new Date().toISOString();
      medicalAnalysisResult.clinicalDataIntegration = {
        medicalHistory: !!(previousConditions && previousConditions.length > 0),
        medications: !!(medications && medications.length > 0),
        clinicalNotes: !!(notes && notes.trim()),
        visualDiagnostics: diagnosticCategories.length > 0,
        anthropometrics: !!(height && weight),
        categoryConstraints: !!symptomCategoryMapping
      };
      medicalAnalysisResult.aiProvider = "Gemini 1.5 Pro - Category-Constrained Medical Reasoning";
      medicalAnalysisResult.diagnosticMethodology = "Systematic Clinical Reasoning with Specialty Constraints";
      
      if (requiresDentalSpecialization) {
        medicalAnalysisResult.specializedDentalMedicine = true;
        medicalAnalysisResult.dentalSymptomsAnalyzed = dentalSymptomsList;
        medicalAnalysisResult.oralHealthSystemicCorrelation = true;
        medicalAnalysisResult.dentalSpecialtyConstraints = true;
      }
      
      return new Response(
        JSON.stringify(medicalAnalysisResult),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (jsonParsingError) {
      console.error("Medical analysis JSON parsing error:", jsonParsingError);
      console.error("Raw AI response:", aiResponse);
      
      // Enhanced JSON extraction with medical fallback
      try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const extractedMedicalJson = JSON.parse(jsonMatch[0]);
          
          // Ensure medical analysis structure
          if (!extractedMedicalJson.conditions) {
            extractedMedicalJson.conditions = [];
          }
          if (!extractedMedicalJson.overallClinicalAssessment) {
            extractedMedicalJson.overallClinicalAssessment = {
              primaryWorkingDiagnosis: "Requires clinical correlation within appropriate specialty",
              urgencyClassification: "moderate",
              categoryConstraintVerification: "Unable to verify specialty constraints due to parsing error"
            };
          }
          
          return new Response(
            JSON.stringify(extractedMedicalJson),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } catch (extractionError) {
        console.error("Failed to extract medical analysis JSON:", extractionError);
      }
      
      // Medical analysis fallback response with category awareness
      const medicalFallbackResponse = {
        medicalReasoningAnalysis: {
          systematicApproach: "Analysis incomplete due to technical error",
          clinicalSynthesis: "Requires manual clinical review within appropriate specialty",
          differentialProcess: "Unable to complete systematic analysis",
          categoryConstraintCompliance: "Unable to verify specialty constraint compliance"
        },
        conditions: [{
          name: "Clinical Analysis Incomplete",
          medicalSpecialty: "Requires determination",
          categoryContext: "Unable to determine due to technical error",
          diagnosticConfidence: "Low - Technical Error",
          clinicalReasoning: "Unable to complete comprehensive medical analysis within specialty constraints. Clinical consultation recommended for accurate diagnosis.",
          treatmentConsiderations: "Seek professional medical evaluation within appropriate specialty",
          urgencyLevel: "Moderate - Clinical review needed",
          specialtyReferralRecommendation: "Consult appropriate medical specialist based on symptom category"
        }],
        overallClinicalAssessment: {
          primaryWorkingDiagnosis: "Requires clinical evaluation within appropriate specialty",
          urgencyClassification: "moderate",
          diagnosticCertainty: "Low due to technical error",
          categoryConstraintVerification: "Unable to verify due to technical error"
        },
        error: "Medical reasoning analysis incomplete",
        clinicalRecommendation: "Consult healthcare professional within appropriate medical specialty for comprehensive evaluation",
        categoryConstrainedAnalysis: false,
        technicalError: true
      };
      
      return new Response(
        JSON.stringify(medicalFallbackResponse),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error("Critical error in category-constrained medical reasoning analysis:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || "Critical medical analysis system error",
        medicalFallback: true,
        conditions: [],
        overallClinicalAssessment: {
          primaryWorkingDiagnosis: "System error - unable to complete analysis",
          urgencyClassification: "moderate",
          clinicalRecommendation: "Seek professional medical evaluation within appropriate specialty",
          categoryConstraintVerification: "Unable to verify due to system error"
        },
        categoryConstrainedAnalysis: false,
        systemError: true
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function isEyeSymptom(symptom: string): boolean {
  const eyeSymptoms = [
    "Blurry vision", "Eye redness", "Eye pain", "Dry eyes", 
    "Watery eyes", "Eye discharge", "Light sensitivity", 
    "Double vision", "Eye strain"
  ];
  return eyeSymptoms.includes(symptom);
}

function isSkinSymptom(symptom: string): boolean {
  const skinSymptoms = [
    "Rash", "Itching", "Bruising", "Dryness", 
    "Sores", "Changes in mole"
  ];
  return skinSymptoms.includes(symptom);
}

function isDentalSymptom(symptom: string): boolean {
  const dentalSymptoms = [
    "Tooth pain", "Gum bleeding", "Tooth sensitivity", "Bad breath", "Loose teeth", "Jaw pain", "Tooth decay", "Gum swelling", "Cracked tooth", "Wisdom tooth pain",
    "Mouth ulcers", "Oral lesions", "Tongue pain", "Dry mouth", "Burning mouth sensation", "Oral infections",
    "Facial swelling", "Jaw stiffness", "TMJ disorders", "Facial trauma", "Impacted teeth", "Oral cysts",
    "White patches in mouth", "Red patches in mouth", "Oral cancer symptoms", "Unusual growths in mouth", "Recurring mouth infections",
    "Denture problems", "Crown pain", "Bridge discomfort", "Missing teeth", "Bite problems", "Chewing difficulties",
    "Root canal pain", "Filling sensitivity", "Cavity pain", "Tooth nerve pain", "Post-treatment sensitivity",
    "Children's dental pain", "Teething problems", "Dental development issues", "Early childhood caries",
    "Gum disease", "Gum recession", "Periodontal pockets", "Gum inflammation", "Plaque buildup", "Tartar formation",
    "Oral hygiene issues", "Preventive care needs", "Community dental problems",
    "Crooked teeth", "Overbite", "Underbite", "Crossbite", "Spacing issues", "Jaw alignment problems", "Braces pain"
  ];
  return dentalSymptoms.includes(symptom);
}
