import { GoogleGenAI } from "@google/genai";
import readlineSync from "readline-sync";
import "dotenv/config";

const History = [];
const ai = new GoogleGenAI(process.env.GOOGLE_API_KEY);

function sum({ num1, num2 }) {
  return num1 + num2;
}

function prime({ num }) {
  if (num < 2) return false;

  for (let i = 2; i <= Math.sqrt(num); i++) if (num % i == 0) return false;

  return true;
}

async function getCryptoPrice({ coin }) {
  const response = await fetch(
    `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${coin}`
  );
  const data = await response.json();

  return data;
}

async function getWeather({city}) {
  const response = await fetch(`
https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${process.env.WEATHER_API_KEY}&units=metric`);
const data = await response.json();
return data;
    
}

async function getNews({news}) {
 const response = await fetch(`https://newsapi.org/v2/everything?q=${news}&sortBy=publishedAt&language=en&apiKey=${process.env.NEWS_API_KEY}`);

  const data = await response.json();
  return data;
  
}
  


const sumDeclaration = {
  name: "sum",
  description: "Get the sum of 2 number",
  parameters: {
    type: "OBJECT",
    properties: {
      num1: {
        type: "NUMBER",
        description: "It will be first number for addition ex: 10",
      },
      num2: {
        type: "NUMBER",
        description: "It will be Second number for addition ex: 10",
      },
    },
    required: ["num1", "num2"],
  },
};

const primeDeclaration = {
  name: "prime",
  description: "Get if number is prime or not",
  parameters: {
    type: "OBJECT",
    properties: {
      num: {
        type: "NUMBER",
        description: "It will be the number to find it is prime or not ex: 13",
      },
    },
    required: ["num"],
  },
};

const cryptoDeclaration = {
  name: "getCryptoPrice",
  description: "Get the current price of any crypto Currency like bitcoin",
  parameters: {
    type: "OBJECT",
    properties: {
      coin: {
        type: "STRING",
        description: "It will be the crypto currency name, like bitcoin",
      },
    },
    required: ["coin"],
  },
};

const weatherDeclaration = {
  name: "getWeather",
  description: "Get the current weather of any city",
  parameters: {
    type: "OBJECT",
    properties: {
      city: {
        type: "STRING",
        description: "It will be the city name, like New York",
      },
    },
    required: ["city"],
  },
};

const newsDeclaration = {
  name: "getNews",
  description: "Get the latest news about a topic",
  parameters: {
    type: "OBJECT",
    properties: {
      news: {
        type: "STRING",
        description: "It will be the topic for which you want to get news, like Tesla",
      },
    },
    required: ["news"],
  },
};

const availableTools = {
  sum: sum,
  prime: prime,
  getCryptoPrice: getCryptoPrice,
  getWeather: getWeather,
  getNews: getNews,
};

async function runAgent(userProblem) {
  History.push({
    role: "user",
    parts: [{ text: userProblem }],
  });
  while (true) {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: History,
      config: {
        systemInstruction: `You are an AI Agent, You have access of 5 available tools like to
        to find sum of 2 number, get crypto price of any currency and find a number is prime or not,weather of any city and latest news about a topic.
        
        Use these tools whenever required to confirm user query.
        If user ask general question you can answer it directly if you don't need help of these three tools`,
        tools: [
          {
            functionDeclarations: [
              sumDeclaration,
              primeDeclaration,
              cryptoDeclaration,
              weatherDeclaration,
              newsDeclaration,
            ],
          },
        ],
      },
    });
    if (response.functionCalls && response.functionCalls.length > 0) {
      console.log(response.functionCalls[0]);
      const { name, args } = response.functionCalls[0];

      const funCall = availableTools[name];
      const result = await funCall(args);

      const functionResponsePart = {
        name: name,
        response: {
          result: result,
        },
      };

      // model
      History.push({
        role: "model",
        parts: [
          {
            functionCall: response.functionCalls[0],
          },
        ],
      });

      // result Ko history daalna

      History.push({
        role: "user",
        parts: [
          {
            functionResponse: functionResponsePart,
          },
        ],
      });
    } else {
      History.push({
        role: "model",
        parts: [{ text: response.text }],
      });
      console.log(response.text);
      break;
    }
  }
}

async function main() {
    const userProblem = readlineSync.question("Ask me anything--> ");
    await runAgent(userProblem);
    main();
}


main();