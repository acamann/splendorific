import { Document, MongoClient, WithId } from 'mongodb';
import { version } from './../package.json';

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}/?retryWrites=true&w=majority`;
const database = "Splendorific";

const client = new MongoClient(uri);

const saveDocument = async (collection: string, document: {}) => {
  await client.connect();
  const collectionClient = client.db(database).collection(collection);
  await collectionClient.insertOne(document);
  await client.close();
}

const saveDocuments = async (collection: string, documents: {}[]) => {
  await client.connect();
  const collectionClient = client.db(database).collection(collection);
  await collectionClient.insertMany(documents);
  await client.close();
}

const dequeue = async <TSchema extends Document>(collection: string): Promise<WithId<TSchema> | undefined> => {
  await client.connect();
  const collectionClient = client.db(database).collection<TSchema>(collection);
  const foundItem = await collectionClient.findOneAndDelete({});
  await client.close();
  return foundItem.value ?? undefined;
}

export const saveSimulationToDB = async (simulation: {}) =>
  await saveDocument("Simulations", {
    ...simulation,
    timestamp: new Date().getTime(),
    version
  });

export const saveGameToDB = async (gameData: {}) =>
  await saveDocument("Games", {
    ...gameData,
    timestamp: new Date().getTime(),
    version
  });

type PlayerConfiguration = { aiExperience: number };
type SimulationRequest = { games: number, players: PlayerConfiguration[] }

export const queueSimulations = async (requests: SimulationRequest[]) =>
  await saveDocuments("Simulation Queue", requests);

export const tryDequeueSimulationRequest = async (): Promise<SimulationRequest | undefined> => {
  return await dequeue<SimulationRequest>("Simulation Queue");
}