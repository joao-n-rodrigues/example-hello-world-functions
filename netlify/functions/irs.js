// hello there!
// 
// I'm a serverless function that you can deploy as part of your site.
// I'll get deployed to AWS Lambda, but you don't need to know that. 
// You can develop and deploy serverless functions right here as part
// of your site. Netlify Functions will handle the rest for you.

const calculate = require("../../src/services/categoryA");

exports.handler = async event => {

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204, headers: {
        'Access-Control-Allow-Origin': '*'
      }, body: "",
    }
  }

  // Only allow POST
  if (event.httpMethod === 'POST') {
    return {
      statusCode: 200, headers: {
        'content-type': 'application/json', 'Access-Control-Allow-Origin': '*'
      }, body: JSON.stringify(calculate(JSON.parse(event.body))),
    }
  }
}