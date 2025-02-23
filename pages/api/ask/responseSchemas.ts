export const responseSchemas = {
  meal: `
  - **finalRecommendation:** Break down the final dosage into **preBolus** and **extendedBolus**. Also include the current **BGL** and **trend direction**.
  - **dosageBreakdown:** Provide a detailed breakdown of the dosage broken down into **step** and **detail**. Format all numerical values in bold markdown for this section only. Explain when Android APS algorithm has been used.
  - **notes:** Include any additional notes or considerations.`,
  plannedActivity: `
  - **finalRecommendation:**
    Include the current **BGL** and **trend direction**.
    If activity will result in a drop in BGL, recommend additional carbs. If activity will result in a rise in BGL, recommend a preBolus.
    If additional carbs are required, break down the final dosage into **fastCarbs** and **slowCarbs**.
    If dosing insulin, break down the final dosage into **preBolus** and **extendedBolus**.
  - **carbBreakdown:** If activity requires additional carbs, provide a detailed breakdown of the dosage broken down into **step** and **detail**. Format all numerical values in bold markdown for this section only. Explain when Android APS algorithm has been used.
  - **dosageBreakdown:** If activity requires insulin dosage, provide a detailed breakdown of the dosage broken down into **step** and **detail**. Format all numerical values in bold markdown for this section only. Explain when Android APS algorithm has been used.
  - **notes:** Include any additional notes or considerations.`,
}
