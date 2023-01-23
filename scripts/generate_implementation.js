#!/usr/bin/env node
const fs = require('fs');
const { parse } = require('@asyncapi/parser')

/**
 * AsycAPI spec as input
 * Parse spec to get solace binding object
 * For every queue in the solace binding:
 * * queues.push(queueName)
 * * generate_template(COS, queueName, accessType, subscriptions)
 * Place <queueName>_implementation.json in implementation directory
 * Commit the file: 
 * * git add implementation/*
 * * git commit -m "Added implementation for ${queues}"
 */

function generate_template(COS, queueName, accessType, subscriptions) {

}

async function main() {
  let data = process.argv.slice(2);
  const spec = Buffer.from(data[0], 'base64').toString('utf8');
  let doc = await parse(spec)
  console.log("\n\n===== AsyncAPI File =====\n\n")
  console.log(doc)

}

if (require.main === module) {
  main();
}




