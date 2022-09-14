import type { NextPage, NextPageContext } from 'next'
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
          <h2 style={{ padding: 0, margin : 0 }}>Simulation Queue ({simulationQueue.length})</h2>
          <ol style={{ overflowY: "auto", maxHeight: "90%", margin: 0, padding: 0 }}>
            {simulationQueue.map((s, i) => 
              <li key={i} style={{ padding: "8px 0", listStyle: "none", margin: 0 }}>
                {`${s.games} games: ${s.players.map(p => Math.round(p.aiExperience * 100)).join(" vs ")}`}
              </li>
            )}
          </ol>
        </div>
        <div style={{ flexBasis: "75%", background: "white", padding: 16, maxHeight: "90vh" }}>
          <h2 style={{ padding: 0, margin : 0 }}>Simulation Results</h2>
          <ol style={{ overflowY: "auto", maxHeight: "90%", margin: 0, padding: 0 }}>
            {simulations.map((s, i) => 
              <li key={i} style={{ padding: "8px 0", listStyle: "none", margin: 0, display: "flex", gap: 24, fontSize: "0.9em" }}>
                <div>{`${new Date(s.timestamp).toLocaleString()}`}</div>
                <div>{`${s.games} games, ${s.players.length} players`}</div>
                {s.players.map((p, i) => <div key={i}>{`${Math.round(p.experience * 100)} => ${Math.round(p.winPercentage * 100)}%`}</div>)}
              </li>
            )}
          </ol>
        </div>
      </main>
    </>
  )
}

export async function getServerSideProps({ res }: NextPageContext): Promise<{ props: SimulationPageProps }> {
  res?.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=59');

  // JSON stringify and parse doesn't seem like proper solution - https://stackoverflow.com/a/67466645
  return {
    props: {
      simulationQueue: JSON.parse(JSON.stringify(await getQueuedSimulations())),
      simulations: JSON.parse(JSON.stringify(await getSimulationResults()))
    }
  }
}

export default Simulations;
