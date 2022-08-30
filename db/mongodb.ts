import { MongoClient } from 'mongodb';
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

export const saveSimulationToDB = async (simulationData: {}) =>
  await saveDocument("Simulations", {
    ...simulationData,
    timestamp: new Date().getTime(),
    version
  });