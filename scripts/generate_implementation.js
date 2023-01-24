#!/usr/bin/env node

// NOTE: This script assumes $GITHUB_ENV env variable is set
// You can set it via export GITHUB_ENV="<path_to_random_txt_file"
const fs = require('fs');
const { parse } = require('@asyncapi/parser')
const { exec } = require('child_process');


/**
 * Base64 Encoded AsycAPI spec as input
 * Parse spec to get solace binding object
 * For every queue in the solace binding:
 * * QUEUES.push(queueName)
 * * generate_template(binding)
 * Place <queueName>_implementation.json in implementation directory
 */

let QUEUES = []

function generate_template(binding) {

  // Extract queue properties from binding
  binding.destinations.map( destination => {
    if (destination.destinationType == "queue") {
      let COS = destination["x-ep-class-of-service"] || "gold"
      let queueName = destination.queue.name || null
      let accessType = destination.queue.accessType || "exclusive"
      let subscriptions = destination.queue.topicSubscriptions || null
      QUEUES.push(queueName)

      // console.log(`${queueName} queue has ${COS} class of service and ${accessType} accessType with subscriptions ${subscriptions}`)

      // Read the respected COS template
      const template_dir = fs.opendirSync('../templates')
      let file
      while ((file = template_dir.readSync()) !== null) {
        if (file.name.includes(COS)) {
          fs.readFile(`../templates/${file.name}`, 'utf8', (err, data) => {
            if (err) {
              console.error(err);
              return;
            }
            // Replace placeholder
            let template = data.replace('$QUEUE_NAME', `"${queueName}"`)
            template = template.replace('$QUEUE_ACCESSTYPE', `"${accessType}"`)
            template = template.replace('$QUEUE_SUBSCRIPTION', `"${subscriptions}"`)
            // Write new file
            fs.writeFile(`../implementation/${queueName}-implementation.json`, template, function (err) {
              if (err) throw err;
            });
          });
        }
      }
      template_dir.closeSync()
    }
  })
}

async function main() {

  // Base64 Decode AsyncAPI spec and parse
  let data = process.argv.slice(2);
  const spec = Buffer.from(data[0], 'base64').toString('utf8');
  let doc = await parse(spec)

  for (const [key, channel] of Object.entries(doc.channels())) {

    // Publish operations
    channel.hasPublish() && channel.publish().hasBindings() && channel.publish().bindings().solace ? generate_template(channel.publish().bindings().solace) : null

    // Subscribe operations
    channel.hasSubscribe() && channel.subscribe().hasBindings() && channel.subscribe().bindings().solace ? generate_template(channel.subscribe().bindings().solace) : null

  }
  console.log(`\n${QUEUES.length} implementation file(s) generated with the following queues: \n${QUEUES}`)
  exec(`echo "QUEUES=${QUEUES}" >> $GITHUB_ENV`, (err) => {
    if (err) {
      console.error(err)
      return 1
    }
  })
}

if (require.main === module) {
  main();
}
