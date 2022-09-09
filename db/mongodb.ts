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

const saveDocuments = async (collection: string, documents: {}[]) => {
  await client.connect();
  const collectionClient = client.db(database).collection(collection);
  await collectionClient.insertMany(documents);
  await client.close();
}

export const saveSimulationToDB = async (simulation: {}) =>
  await saveDocument("Simulations", {
    ...simulation,
    timestamp: new Date().getTime(),
    version
  });


export const saveSimulationsToDB = async (simulations: {}[]) =>
  await saveDocuments("Simulations", simulations.map(data => {
    return {
      ...data,
      timestamp: new Date().getTime(),
      version
    }
  }));

export const saveGameToDB = async (gameData: {}) =>
  await saveDocument("Games", {
    ...gameData,
    timestamp: new Date().getTime(),
    version
  });