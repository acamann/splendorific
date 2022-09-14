import type { NextPage } from 'next'
import Head from 'next/head'
import { getQueuedSimulations, getSimulationResults, SimulationRequest, SimulationResult } from '../../db/mongodb';

type SimulationPageProps = {
  simulationQueue: SimulationRequest[],
  simulations: SimulationResult[]
}

const Simulations: NextPage<SimulationPageProps> = ({ simulationQueue, simulations }) => {
  return (
    <>
      <Head>
        <title>Splendorific</title>
        <meta name="description" content="Splendor clone" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main style={{ display: "flex", gap: 24, padding: 24 }}>
        <div style={{ flexBasis: "25%", background: "white", padding: 16, maxHeight: "90vh" }}>
          <h1 style={{ padding: 0, margin : 0 }}>Simulation Queue</h1>
          <ol style={{ overflowY: "auto", maxHeight: "90%" }}>
            {simulationQueue.map((s, i) => 
              <li key={i}>
                {`${s.games} games: ${s.players.map(p => p.aiExperience).join(" vs ")}`}
              </li>
            )}
          </ol>
        </div>
        <div style={{ flexBasis: "75%", background: "white", padding: 16, maxHeight: "90vh" }}>
          <h1 style={{ padding: 0, margin : 0 }}>Simulation Results</h1>
          <ol style={{ overflowY: "auto", maxHeight: "90%" }}>
            {simulations.map((s, i) => 
              <li key={i}>
                <div>{`${s.games} games, ${s.players.length} players.`}</div>
                {s.players.map((p, i) => <div key={i}>{`Experience Level ${Math.round(p.experience * 100)} => ${Math.round(p.winPercentage * 100)}%`}</div>)}
              </li>
            )}
          </ol>
        </div>
      </main>
    </>
  )
}

export async function getStaticProps(): Promise<{ props: SimulationPageProps }> {
  // JSON stringify and parse doesn't seem like proper solution - https://stackoverflow.com/a/67466645
  return {
    props: {
      simulationQueue: JSON.parse(JSON.stringify(await getQueuedSimulations())),
      simulations: JSON.parse(JSON.stringify(await getSimulationResults()))
    }
  }
}

export default Simulations;
