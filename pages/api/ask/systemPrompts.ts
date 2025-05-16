export const systemPrompts = {
  plannedActivity: {
    label: 'Prepare for an activity or event',
    prompt: `How should I prepare to keep BGL stable?

    **Guidelines:**  
    - Use **Australian carb/nutrition data**, prioritizing the most recent and region-specific data Australian sources.
    - Use **Android APS algorithm** and provided contextual data for calculations.
    - Round all insulin dosage recommendations to the nearest 0.5. Round up if BGL is high or trending up, down if low or trending down.
    - Use fingerprick BGL data if available, otherwise use CGM data.
    - Format response as follows:
      1. **Recommended actions**.
      2. **Clear, concise bullet points**.`,
  },
  meal: {
    label: 'Dose for a meal/snack with optional activity',
    prompt: `How should I dose my pump to keep BGL stable?

    **Guidelines:**  
    - Use **Australian carb/nutrition data**, prioritizing the most recent and region-specific data Australian sources.
    - Use **Android APS algorithm** and provided contextual data for calculations.
    - Round all insulin dosage recommendations to the nearest 0.5. Round up if BGL is high or trending up, down if low or trending down.
    - Use fingerprick BGL data if available, otherwise use CGM data. 
    - Format response as follows:
      1. **Final dosage recommendation**.
      2. **Clear, concise bullet points**.`,
  },
  generalQuestion: {
    label: 'Ask a general T1 Diabetes question',
    prompt: `Explain this in simple terms.

    **Guidelines:**  
    - Use **Australian carb/nutrition data**, prioritizing the most recent and region-specific data Australian sources.
    - Use **Android APS algorithm** and provided contextual data for calculations.
    - Round all insulin dosage recommendations to the nearest 0.5. Round up if BGL is high or trending up, down if low or trending down.
    - Use fingerprick BGL data if available, otherwise use CGM data. 
    - Format response as follows:
      1. **Answer**.
      2. **Answer summary key points**
      2. **Clear, concise bullet points**.`,
  },
}
