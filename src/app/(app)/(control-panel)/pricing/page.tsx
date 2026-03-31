"use client"

import React from 'react'
import PricingPlans from '@/components/shared/pricing-plans'

const DashboardPricingPage = () => {
    return (
        <div className="py-2">
            <PricingPlans showHeader={true} />
        </div>
    )
}

export default DashboardPricingPage
