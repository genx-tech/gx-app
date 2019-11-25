"use strict";

const normalWorker = require('./worker');

/**
 * Start a message queue worker.
 * @param {*} workingPath 
 * @param {*} configName 
 * @param {*} queueService 
 * @param {*} queueName 
 * @param {*} worker 
 * @param {*} workerIndex 
 * @param {*} ackOnError 
 */
function startQueueWorker(workingPath, configName, queueService, queueName, worker, workerIndex = 0, ackOnError = false) {
    let workerName = queueName + 'Worker';
    let workerId = workerName + workerIndex.toString();    

    return normalWorker(workingPath, configName, async (app) => {
        let messageQueue = app.getService(queueService);

        app.log('info', `Queue worker "${workerId}" is started and waiting for message on queue "${queueName}" ...`);

        await messageQueue.workerConsume_(queueName, (channel, msg) => {            
            let info;

            try {
                info = JSON.parse(msg.content.toString());
            } catch (error) {
                app.log('error', 'The incoming message is not a valid JSON string.');
                channel.ack(msg);  
                return;
            }

            if (info && info.$mock) {
                app.log('info', 'A mock message received.\nMessage: ' + raw);
                channel.ack(msg);  
                return;
            }

            worker(app, info).then((shouldAck) => {
                if (shouldAck) {                    
                    channel.ack(msg);  
                } else {
                    channel.nack(msg);  
                }
            }).catch(error => {
                app.log('error', error.message, { ...error.info, stack: error.stack });

                if (error.needRetry) {
                    channel.nack(msg);  
                } else if (ackOnError) {
                    channel.ack(msg);
                } else {
                    channel.nack(msg);  
                }                
            });
        });

    }, workerId);
}

module.exports = startQueueWorker;