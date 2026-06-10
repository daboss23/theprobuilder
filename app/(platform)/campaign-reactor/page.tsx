import { PageHeader } from '@/components/reactor/ui'
import { Workbench } from './Workbench'

export default function CampaignReactorPage() {
  return (
    <>
      <PageHeader
        system="06"
        title="Campaign Reactor"
        subtitle="The generation engine. Feed in research, transformations, creative, copy, frameworks, SOPs, and patterns — fire the reactor to synthesize the next winning campaign."
        tagline="Engineered For Performance."
      />
      <Workbench />
    </>
  )
}
