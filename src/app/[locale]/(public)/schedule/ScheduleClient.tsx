'use client'

import React from 'react'
import { WorkshopScheduleSection } from './content/WorkshopScheduleSection'
import { WorkshopThreeThings } from './content/WorkshopThreeThings'

export function ScheduleClient() {
  return (
    <div className="overflow-x-hidden">
      <WorkshopScheduleSection />
      <WorkshopThreeThings />
    </div>
  )
}
