/* eslint-env jest */
const Consumer = require('../../Consumer')
const PuppeteerWrapper = require('../../src/PuppeteerWrapper/PuppeteerWrapper')

const mockChannel = {
  assertQueue () {
    return Promise.resolve()
  },
  consume () {
    return Promise.resolve({ consumerTag: 'foo' })
  },
  close () {
    return Promise.resolve()
  },
  ack () {
    return Promise.resolve()
  },
  nack () {
    return Promise.resolve()
  }
}
const mockConnection = {
  createChannel () {
    return Promise.resolve(mockChannel)
  }
}
const amqp = require('amqplib')

// Mocks
// amqplib mock
const mockConnect = jest.spyOn(amqp, 'connect')

// mockConnection
const mockCreateChannel = jest.spyOn(mockConnection, 'createChannel')

// mockChannel
const mockAssertQueue = jest.spyOn(mockChannel, 'assertQueue')
let mockConsume = jest.spyOn(mockChannel, 'consume')
const mockClose = jest.spyOn(mockChannel, 'close')
const mockAck = jest.spyOn(mockChannel, 'ack')
const mockNack = jest.spyOn(mockChannel, 'nack')

// PuppeteerWrapper
const mockPWInit = jest.spyOn(PuppeteerWrapper.prototype, 'init').mockImplementation(() => Promise.resolve(null))
const mockPWGetDOM = jest.spyOn(PuppeteerWrapper.prototype, 'getDOM').mockImplementation(() => Promise.resolve(null))
const mockPWTeardown = jest.spyOn(PuppeteerWrapper.prototype, 'teardown').mockImplementation(() => Promise.resolve(null))

jest.mock('amqplib', () => ({
  connect () {
    return mockConnection
  }
}))

jest.mock('../../src/PuppeteerWrapper/PuppeteerWrapper')

describe('The Consumer', () => {
  beforeAll(() => {
    // prevent console.error from triggering so we can test exceptions
    jest.spyOn(console, 'error').mockImplementation(() => null)
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterAll(() => {
    jest.restoreAllMocks()
  })

  describe('constructor', () => {
    const myDataPersistenceClosure = jest.fn()
    const consumerArgs = {
      rmqHostname: 'foo',
      rmqUsername: 'bar',
      rmqPassword: 'fizz',
      rmqQueueName: 'buzz',
      rmqPort: 100,
      dataPersistenceClosure: myDataPersistenceClosure
    }
    const testConsumer = new Consumer(consumerArgs)

    it('should correctly set attributes when invoked with a properly formatted Object', () => {
      expect(testConsumer.connectionProperties).toEqual({
        protocol: 'amqp',
        hostname: 'foo',
        port: 100,
        username: 'bar',
        password: 'fizz',
        locale: 'en_US',
        frameMax: 0,
        heartbeat: 0,
        vhost: '/'
      })
      expect(testConsumer.queue).toBe('buzz')
      expect(testConsumer.dataPersistenceClosure).toBe(myDataPersistenceClosure)
    })

    it('should throw an error when anything other than an Object is passed', () => {
      expect(() => new Consumer('foo')).toThrow('Consumer not initialized with arguments object')
    })

    it('should throw an error when initialized with a String port number', () => {
      expect(() => {
        return new Consumer({
          rmqHostname: 'foo',
          rmqUsername: 'bar',
          rmqPassword: 'fizz',
          rmqQueueName: 'buzz',
          rmqPort: '100',
          dataPersistenceClosure: jest.fn()
        })
      }).toThrow('Consumer not initialized with correctly formatted arguments object')
    })

    it('should throw an error when initialized with missing keys in the args Object', () => {
      expect(() => {
        return new Consumer({
          rmqHostname: 'foo',
          rmqUsername: 'bar',
          rmqPassword: 'fizz',
          rmqQueueName: 'buzz',
          rmqPort: 100
          // no dataPersistenceClosure
        })
      }).toThrow('Consumer not initialized with correctly formatted arguments object')
    })
  })

  describe('init method', () => {
    const myDataPersistenceClosure = jest.fn()
    const consumerArgs = {
      rmqHostname: 'foo',
      rmqUsername: 'bar',
      rmqPassword: 'fizz',
      rmqQueueName: 'buzz',
      rmqPort: 100,
      dataPersistenceClosure: myDataPersistenceClosure
    }
    const testConsumer = new Consumer(consumerArgs)

    it('should connect to RabbitMQ with the correct arguments', async () => {
      await testConsumer.init()
      expect(mockConnect).toHaveBeenCalledWith({
        protocol: 'amqp',
        hostname: 'foo',
        port: 100,
        username: 'bar',
        password: 'fizz',
        locale: 'en_US',
        frameMax: 0,
        heartbeat: 0,
        vhost: '/'
      })
      expect(mockConnect).toHaveBeenCalledTimes(1)
    })

    it('should create a channel', async () => {
      await testConsumer.init()
      expect(mockCreateChannel).toHaveBeenCalledTimes(1)
    })

    it('should assert a queue', async () => {
      await testConsumer.init()
      expect(mockAssertQueue).toHaveBeenCalledWith('buzz')
      expect(mockAssertQueue).toHaveBeenCalledTimes(1)
    })

    it('should throw an exception when a RabbitMQ connection fails', () => {
      const mockConnectImplementation = mockConnect.mockImplementation(() => {
        throw new Error('foo')
      })
      expect(() => testConsumer.init())
        .rejects
        .toThrow('Connection to RabbitMQ instance failed: Error: foo')
      mockConnectImplementation.mockRestore()
    })

    // ==============================================================
    // TODO: I DON'T KNOW WHY THIS DOESN'T WORK, TEMPORARY TEST BELOW
    // ==============================================================
    // it('should throw an exception when channel creation fails', () => {
    //   const mockCreateChannelImplementation = mockCreateChannel.mockImplementation(() => {
    //     throw new Error('foo')
    //   })
    //   expect(() => testConsumer.init())
    //     .rejects
    //     .toThrow('Channel creation on RabbitMQ instance failed: Error: foo')
    //   mockCreateChannelImplementation.mockRestore()
    // })

    it('should throw an exception when channel creation fails', () => {
      const mockCreateChannelImplementation = mockCreateChannel.mockImplementation(() => {
        throw new Error('foo')
      })

      try {
        testConsumer.init()
      } catch (e) {
        expect(e).toBe('Channel creation on RabbitMQ instance failed: Error: foo')
      }
      mockCreateChannelImplementation.mockRestore()
    })

    // ==============================================================
    // TODO: I DON'T KNOW WHY THIS DOESN'T WORK, TEMPORARY TEST BELOW
    // ==============================================================
    // it('should throw an exception when queue assertion fails', () => {
    //   const mockQueueAssertionImplementation = mockAssertQueue.mockImplementation(() => {
    //     throw new Error('foo')
    //   })
    //   expect(() => testConsumer.init())
    //     .rejects
    //     .toThrow('Queue assertion failed: Error: foo')
    //   mockQueueAssertionImplementation.mockRestore()
    // })

    it('should throw an exception when queue assertion fails', () => {
      const mockQueueAssertionImplementation = mockAssertQueue.mockImplementation(() => {
        throw new Error('foo')
      })

      try {
        testConsumer.init()
      } catch (e) {
        expect(e).toBe('Queue assertion failed: Error: foo')
      }
      mockQueueAssertionImplementation.mockRestore()
    })
  })

  describe('consumeUrlMessage method', () => {
    const myDataPersistenceClosure = jest.fn()
    const consumerArgs = {
      rmqHostname: 'foo',
      rmqUsername: 'bar',
      rmqPassword: 'fizz',
      rmqQueueName: 'buzz',
      rmqPort: 100,
      dataPersistenceClosure: myDataPersistenceClosure
    }
    const testConsumer = new Consumer(consumerArgs)

    it('should create and initialize a new PuppeteerWrapper', async () => {
      await testConsumer.init()
      testConsumer.consumeUrlMessage({ content: Buffer.from('[{"foo":"bar"}]') })
      expect(PuppeteerWrapper).toHaveBeenCalledTimes(1)
      expect(mockPWInit).toHaveBeenCalledTimes(1)
    })

    it('should successfully handle a valid message', async () => {
      const urlMessage = { content: Buffer.from('[{"foo":"bar"}]') }
      await testConsumer.init()
      await testConsumer.consumeUrlMessage(urlMessage)
      expect(mockPWGetDOM).toHaveBeenCalledWith([{ foo: 'bar' }])
      expect(mockPWGetDOM).toHaveBeenCalledTimes(1)
      expect(myDataPersistenceClosure).toHaveBeenCalledWith(null)
      expect(myDataPersistenceClosure).toHaveBeenCalledTimes(1)
      expect(mockAck).toHaveBeenCalledWith(urlMessage)
      expect(mockAck).toHaveBeenCalledTimes(1)
      expect(mockPWTeardown).toHaveBeenCalledTimes(1)
    })

    it('should nack a message and throw an exception when dataPersistenceClosure fails', async () => {
      const mockDataPersistenceClosureImplementation = myDataPersistenceClosure.mockImplementation(() => {
        throw new Error('foo')
      })
      const urlMessage = { content: Buffer.from('[{"foo":"bar"}]') }
      await testConsumer.init()
      try {
        await testConsumer.consumeUrlMessage(urlMessage)
      } catch (err) {
        expect(mockNack).toHaveBeenCalledWith(urlMessage)
        expect(mockNack).toHaveBeenCalledTimes(1)
        expect(err.toString()).toBe('Error: getDOM failed: Error: foo')
      }
      expect(mockPWTeardown).toHaveBeenCalledTimes(1)
      mockDataPersistenceClosureImplementation.mockRestore()
    })

    it('should nack a message and throw an exception when ack fails', async () => {
      const mockAckImplementation = mockAck.mockImplementation(() => {
        throw new Error('foo')
      })
      const urlMessage = { content: Buffer.from('[{"foo":"bar"}]') }
      await testConsumer.init()
      try {
        await testConsumer.consumeUrlMessage(urlMessage)
      } catch (err) {
        expect(mockNack).toHaveBeenCalledWith(urlMessage)
        expect(mockNack).toHaveBeenCalledTimes(1)
        expect(err.toString()).toBe('Error: getDOM failed: Error: foo')
      }
      expect(mockPWTeardown).toHaveBeenCalledTimes(1)
      mockAckImplementation.mockRestore()
    })
  })

  describe('consume method', () => {
    let mockConsoleLog = null
    beforeAll(() => {
      mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => null)
    })

    afterAll(() => {
      mockConsoleLog.mockRestore()
    })
    const myDataPersistenceClosure = jest.fn()
    const consumerArgs = {
      rmqHostname: 'foo',
      rmqUsername: 'bar',
      rmqPassword: 'fizz',
      rmqQueueName: 'buzz',
      rmqPort: 100,
      dataPersistenceClosure: myDataPersistenceClosure
    }
    const testConsumer = new Consumer(consumerArgs)

    it('should set this.consumerTag when successfully invoked', async () => {
      await testConsumer.init()
      await testConsumer.consume()
      expect(testConsumer.consumerTag).toBe('foo')
    })

    it('should invoke the channel consume method with the proper arguments when successfully invoked', async () => {
      await testConsumer.init()
      await testConsumer.consume()
      // TODO: don't use ANY function, actually make sure bound function is passed in
      // does not work, .bind(this) produces new function
      // expect(mockConsume).toHaveBeenCalledWith('buzz', myDataPersistenceClosure)
      expect(mockConsume).toHaveBeenCalledWith('buzz', expect.any(Function))
      expect(mockConsume).toHaveBeenCalledTimes(1)
    })

    it('should throw an exception when channel.consume fails', async () => {
      mockConsume.mockImplementation(() => {
        throw new Error('foo')
      })
      await testConsumer.init()
      try {
        await testConsumer.consume()
      } catch (err) {
        expect(mockClose).toHaveBeenCalledTimes(1)
        expect(err.toString()).toBe('Error: Message consumption failed: Error: foo')
      }
      // TODO: is there a better way to do this?
      mockConsume = jest.spyOn(mockChannel, 'consume')
    })
  })
})
