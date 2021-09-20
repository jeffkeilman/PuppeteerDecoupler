const amqp = require('amqplib')
const process = require('process')

class Publisher {
  constructor (args) {
    if (typeof args !== 'object') {
      const errorMessage = 'Publisher not initialized with arguments object'
      console.error(errorMessage)
      throw new Error(errorMessage)
    }
    this.connectionProperties = {
      protocol: 'amqp',
      hostname: args.rmqHostname,
      port: args.rmqPort,
      username: args.rmqUsername,
      password: args.rmqPassword,
      locale: 'en_US',
      frameMax: 0,
      heartbeat: 0,
      vhost: '/'
    }
    this.queue = args.rmqQueueName
  }

  async init () {
    try {
      this.client = await amqp.connect(this.connectionProperties)
    } catch (err) {
      const errMessage = `Connection to RabbitMQ instance failed: ${err}`
      console.error(errMessage)
      throw new Error(errMessage)
    }

    try {
      this.channel = await this.client.createChannel()
    } catch (err) {
      const errMessage = `Channel creation on RabbitMQ instance failed: ${err}`
      console.error(errMessage)
      throw new Error(errMessage)
    }

    try {
      this.channel.assertQueue(this.queue)
    } catch (err) {
      const errMessage = `Queue assertion failed: ${err}`
      console.error(errMessage)
      throw new Error(errMessage)
    }
  }

  sendMessage (msg) {
    return this.channel.publish('', this.queue, Buffer.from(msg))
  }

  closeChannel () {
    this.channel.close()
  }
}

const main = async () => {
  const publisherArgs = {
    rmqHostname: process.env.RMQ_HOSTNAME,
    rmqUsername: process.env.RMQ_USERNAME,
    rmqPassword: process.env.RMQ_PASSWORD,
    rmqQueueName: process.env.RMQ_QUEUE_NAME,
    rmqPort: Number(process.env.RMQ_PORT)
  }
  const publisher = new Publisher(publisherArgs)
  await publisher.init()

  const testObject = {
    key: 'val'
  }
  setInterval(() => {
    const testString = JSON.stringify(testObject)
    console.log(`Sending: ${testString}`)
    publisher.sendMessage(testString)
  }, 10000)

  process.on('exit', () => {
    publisher.closeChannel()
  })
}

if (require.main === module) {
  main()
}

module.exports = { Publisher, main }
