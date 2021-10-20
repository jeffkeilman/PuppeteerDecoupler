const amqp = require('amqplib')

const PuppeteerWrapper = require('./src/PuppeteerWrapper/PuppeteerWrapper')

class Consumer {
  constructor (args) {
    if (typeof args !== 'object') {
      const errorMessage = 'Consumer not initialized with arguments object'
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
      !(typeof args.rmqQueueName === 'string') ||
      !(typeof args.dataPersistenceClosure === 'function')
    ) {
      const errorMessage = 'Consumer not initialized with correctly formatted arguments object'
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
    this.dataPersistenceClosure = args.dataPersistenceClosure
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
      // assert queue in case it doesn't exist before consumption
      this.channel.assertQueue(this.queue)
    } catch (err) {
      const errMessage = `Queue assertion failed: ${err}`
      console.error(errMessage)
      throw new Error(errMessage)
    }
  }

  async consumeUrlMessage (urlMessage) {
    // urlMessage.content = [{url:String,name:String},...]
    const urlList = JSON.parse(urlMessage.content.toString('utf-8'))

    const pw = new PuppeteerWrapper()
    await pw.init()

    try {
      this.dataPersistenceClosure(await pw.getDOM(urlList))
      this.channel.ack(urlMessage)
    } catch (err) {
      this.channel.nack(urlMessage)
      const errMessage = `getDOM failed: ${err}`
      console.error(errMessage)
      throw new Error(errMessage)
    } finally {
      pw.teardown()
    }
  }

  async consume () {
    try {
      this.consumerTag = (await this.channel.consume(this.queue, this.consumeUrlMessage.bind(this))).consumerTag
      console.log('Consumer Started:', this.consumerTag)
    } catch (err) {
      this.closeChannel()
      const errMessage = `Message consumption failed: ${err}`
      console.error(errMessage)
      throw new Error(errMessage)
    }
  }

  closeChannel () {
    this.channel.close()
  }
}

module.exports = Consumer
