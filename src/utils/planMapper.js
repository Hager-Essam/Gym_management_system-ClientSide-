
export function mapPlanToPricingCard(plan, index) {
  return {
    id: plan.id,

    name: plan.name,

    tier: plan.access_level.toUpperCase(),

    price: Number(plan.price),

    duration: plan.duration,

    description: plan.description,

    popular: index === 2,

    cta: 'Choose Plan',

    features: [
      ...plan.features.map((feature) => ({
        label: feature,
        included: true,
      })),

      {
        label: 'Personal Training',
        included: plan.includes_personal_training,
      },
    ],
  };
}
