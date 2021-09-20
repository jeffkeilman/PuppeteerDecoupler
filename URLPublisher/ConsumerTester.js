const amqp = require('amqplib')

const consumeMessage = (msg) => {
  const msgObj = JSON.parse(msg.content.toString('utf-8'))
  console.log(`Here is the key: ${msgObj.key}`)
}

const test = async () => {
  const connectionProperties = {
    protocol: 'amqp',
    hostname: process.env.RMQ_HOSTNAME,
    port: Number(process.env.RMQ_PORT),
    username: process.env.RMQ_USERNAME,
    password: process.env.RMQ_PASSWORD,
    locale: 'en_US',
    frameMax: 0,
    heartbeat: 0,
    vhost: '/'
  }

  const client = await amqp.connect(connectionProperties)
  const channel = await client.createChannel()
  channel.consume(process.env.RMQ_QUEUE_NAME, consumeMessage)
}

if (require.main === module) {
  test()
}
