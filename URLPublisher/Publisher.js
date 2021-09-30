const amqp = require('amqplib')

class Publisher {
  constructor (args) {
    if (typeof args !== 'object') {
      const errorMessage = 'Publisher not initialized with arguments object'
      console.error(errorMessage)
      throw new Error(errorMessage)
    }
    if (
      !args.rmqHostname ||
      !args.rmqPort ||
      !args.rmqUsername ||
      !args.rmqPassword ||
      !args.rmqQueueName ||
      !(typeof args.rmqHostname === 'string') ||
      !(typeof args.rmqPort === 'number') ||
      !(typeof args.rmqUsername === 'string') ||
      !(typeof args.rmqPassword === 'string') ||
      !(typeof args.rmqQueueName === 'string')
    ) {
      const errorMessage = 'Publisher not initialized with correctly formatted arguments object'
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
    if (typeof msg !== 'string') {
      const errMessage = 'RabbitMQ can only accept String messages!'
      console.error(errMessage)
      throw new Error(errMessage)
    }
    try {
      this.channel.publish('', this.queue, Buffer.from(msg))
    } catch (err) {
      const errMessage = `Failed to publish message to ${this.queue}: ${err}`
      console.error(errMessage)
      throw new Error(errMessage)
    }
  }

  closeChannel () {
    this.channel.close()
  }
}

module.exports = Publisher
