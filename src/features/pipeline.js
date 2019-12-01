const EventEmitter = require('events');
const path = require('path');
const { eachAsync_, _ } = require('rk-utils');
const { Types: { DATETIME }, Generators } = require('@genx/data');
const { dependsOn, requireConfig } = require('../utils/Helpers');

/**
 * Enable pipeline engine
 * @module Feature_Pipeline
 */

const SEC_MINUTES = 60;
const SEC_PER_HOUR = SEC_MINUTES*60;
const SEC_PER_DAY = SEC_PER_HOUR*24;
const SEC_PER_MONTH = SEC_PER_DAY*30;

const JOB_INFO = 'jobInfo';
const JOB_STATUS = 'jobStatus';
const JOB_SCHEDULE = 'jobSchedule';

const FEATURE_NAME = path.basename(__filename, '.js');

class Pipeline extends EventEmitter {
    constructor(store, queue, logger) {
        super();

        this.store = store;
        this.jobQueue = queue;
        this.logger = logger;
    }

    log = (level, message, ...rest) => {
        this.logger && this.logger.log(level, message, ...rest);
        return this;
    }

    logError = (error) => {
        return this.logger && this.logger.logError(error);
    }

    async initStore_() {
        //create JOB_INFO index
        await this.store.onCollection_(JOB_INFO, collection => collection.createIndexes([
            { key: { name: 1 }, unique: true }
        ]));
    
        //create JOB_SCHEDULE index
        await this.store.onCollection_(JOB_SCHEDULE, collection => collection.createIndexes([
            { key: { job: 1, schedule: 1, batch: 1 }, unique: true }
        ]));
    
        //create JOB_STATUS index
        await this.store.onCollection_(JOB_STATUS, collection => collection.createIndexes([
            { key: { startedAt: 1 }, expireAfterSeconds: SEC_PER_MONTH }
        ]));

        this.defineJobs_([
            {
                name: '_built_in_timer',
                pipeline: [ '@_timed_task' ],
                priority: 0, 
                expiry: SEC_MINUTES*5
            }
        ]);
    }

    async startBuiltinWorkers_() {
        const builtinQueues = [ '_timed_task' ];

        await eachAsync_(builtinQueues, queueName => this.queue.workerConsume_(queueName, (channel, msg) => {            
            let info = JSON.parse(msg.content.toString());

            worker(app, info).then((shouldAck) => {
                if (shouldAck) {                    
                    channel.ack(msg);  
                } else {
                    channel.nack(msg);  
                }
            }).catch(error => {
                this.logError(error);

                if (error.needRetry) {
                    channel.nack(msg);  
                } else {
                    channel.ack(msg);
                }            
            });
        }));

    }
    
    async defineJobs_(jobsInfo) {
        jobsInfo = _.castArray(jobsInfo);
    
        let now = DATETIME.typeObject.local().toJSDate();
        
        await eachAsync_(jobsInfo, info => store.upsertOne_(JOB_INFO, { 
            ...info,            
            createdAt: now 
        }, { name: info.name }));
    }

    async registerWorker_(task, worker) {

    }

    async startJobs_(jobs) {

    }
    
    async scheduleJobs(scheduleList) {
        scheduleList = _.castArray(scheduleList);
    
        let now = DATETIME.typeObject.local().toJSDate();


    
        await eachAsync_(scheduleList, scheduleRecord => store.insertOneIfNotExist_(JOB_SCHEDULE, { ...scheduleRecord, status: 'pending', createdAt: now }));
    }
    
    /*
    async startJobsBySchedule_(filters) {
        let now = DATETIME.typeObject.local().toJSDate();
    
        let jobsToRun = await this.store.updateManyAndReturn_(
            JOB_SCHEDULE, 
            { status: 'running', runningAt: now }, 
            {             
                ...filters,
                status: 'pending', 
                $or: [ 
                    { doneAt: { $exists: false } },
                    { minInterval: { $exists: false } },
                    { $expr: { $lt: [ { $add: ['$doneAt', '$minInterval' ] }, now ]  } } // or expired
                ] 
            }
        );
    
        if (jobsToRun && jobsToRun.length > 0) {
            await eachAsync_(jobsToRun, async jobSchedule => async this.start(engine, jobSchedule));
        }
    
        return jobsToRun;
    }*/
    
    /**
     * Start immediate job or schedule
     * @param {object} [schedule] 
     */
    async start_(jobs) {
        let jobSet = new Set();

        jobs = jobs.map(job => {
            if (typeof job === 'string') {
                jobSet.add(job);

                return {
                    name: job
                }
            } else if (Array.isArray(job)) {
                let [name, data] = job; 
                jobSet.add(job);
                

                return {
                    name,
                    data
                };
            }

            return job;
        });

        let jobInfo = await this.store.findAll_(JOB_INFO, { name: jobName });


        try {
    
            //todo order by priority
           
    
            if (jobInfo) {
                let step0 = 'jq_' + jobInfo.pipeline[0];
                let jobName = jobSchedule.job;
                let ref = Generators.shortid();
    
                let now = DATETIME.typeObject.local().toJSDate();
                
                let ret = await jobQueue.sendToWorkers_(step0, { ref, job: jobName, step: 0, data: { ...jobInfo.data, ...jobSchedule.data } });
                if (!ret) {
                    throw new Error(`Failed to send the job [${jobName}] to the worker queue [${step0}].`);
                }
    
                let jobStatus = { 
                    _id: ref, 
                    name: jobName, 
                    status: 'started', 
                    startedAt: now, 
                    schedule: jobSchedule._id, 
                    runOnce: jobSchedule.runOnce,
                    pipeline: jobInfo.pipeline,
                    step: 0,
                    state: [{ status: 'started', startedAt: now }]                               
                };
    
                await store.insertOne_(JOB_STATUS, jobStatus);
                
                //add timer for expire check
            } else {
                throw new Error(`Job [${jobName}] not found.`);
            }
        } catch (error) {
            engine.logger.log('error', error.message, { name: error.name, stack: error.stack });
    
            if (jobSchedule.runOnce) {
                await store.deleteOne_(JOB_SCHEDULE, { _id: jobSchedule._id });
            } else {
                await store.updateOne_(JOB_SCHEDULE, { status: 'pending', doneAt: now }, { _id: jobSchedule._id });
            }
    
            throw error;
        }
    }
    
    async nextStep({ store, jobQueue, logger }, { ref, nextQueueName, job, nextStep, data }) {
        let now = DATETIME.typeObject.local().toJSDate();
        let ret = await jobQueue.sendToWorkers_(nextQueueName, { ref, job, step: nextStep, data });
        if (ret) {        
            await store.updateOne_(JOB_STATUS, { step: nextStep, $push: { state: { status: 'started', startedAt: now } } }, { _id: jobRef });
        } else {
            await store.updateOne_(JOB_STATUS, { step: nextStep, $push: { state: { status: 'failed', failedAt: now } } }, { _id: jobRef }); // failed for fail to start, error for failure during stage
        }
    }
    
    async proceed({ store, jobQueue, logger }, jobRef, state, nextStepData) {
        let jobStatus = await store.findOne_(JOB_STATUS, { _id: jobRef });
    
        if (!jobStatus) {
            logger.log('error', 'Job not found');
            return;
        }
           
        let currentStep = jobStatus.step;
        let now = DATETIME.typeObject.local().toJSDate();      
    
        if (currentStep === jobStatus.pipeline.length-1) {
            logger.log('info', `Job [${jobStatus.name}, ref=${jobRef}] done.`, state);
    
            await store.updateOne_(JOB_STATUS, { "state.$[step]": state, status: 'done', 'doneAt': now }, { _id: jobRef }, { arrayFilters: [ { step: currentStep } ] }); 
            await store.updateOne_(JOB_SCHEDULE, { status: 'pending', doneAt: now }, { _id: jobStatus.schedule });
        } else {
            logger.log('info', `Job [${jobStatus.name}, ref=${jobRef}] step[${currentStep}] done.`, state);
    
            await store.updateOne_(JOB_STATUS, { "state.$[step]": state }, { _id: jobRef }, { arrayFilters: [ { step: currentStep } ] }); 
            
            currentStep++;
            let nextQueueName = 'jq_' + jobStatus.pipeline[currentStep]; 
            await nextStep(jobQueue, { ref: jobRef, nextQueueName, job: jobStatus.name, nextStep: currentStep, data: nextStepData });
        }
    }
    
    async error({ store, logger }, jobRef, error) {
        logger.log('error', error.message, { name: error.name, stack: error.stack });
    
        let jobStatus = await store.findOne_(JOB_STATUS, { _id: jobRef });
    
        if (!jobStatus) {
            logger.log('error', 'Job not found');
            return;
        }
           
        let currentStep = jobStatus.step;
        let now = DATETIME.typeObject.local().toJSDate();    
        
        await store.updateOne_(JOB_STATUS, { "state.$[step]": { status: 'error', 'doneAt': now }, error: { name: error.name, message: error.message, stack: error.stack }, status: 'error', 'doneAt': now }, { _id: jobRef }, { arrayFilters: [ { step: currentStep } ] }); 
    
        if (jobStatus.runOnce) {
            await store.deleteOne_(JOB_SCHEDULE, { _id: jobStatus.schedule });
        } else {
            await store.updateOne_(JOB_SCHEDULE, { status: 'pending', doneAt: now }, { _id: jobStatus.schedule });
        }
    }
    
}

module.exports = {
    /**
     * This feature is loaded at plugin stage
     * @member {string}
     */
    type: Feature.PLUGIN,

    /**
     * Load the feature
     * @param {App} app - The app module object
     * @param {object} config - Pipeline engine config
     * @property {string} config.store - Data store service
     * @property {string} config.queue - Job queue service
     * @property {string} [config.logger] - Logger service
     * @returns {Promise.<*>}
     */
    load_: (app, config) => {
        requireConfig(app, config, [ 'store', 'queue' ], FEATURE_NAME);
        dependsOn([ 'dataSource' ], app, FEATURE_NAME);

        let store = app.getService(config.store);
        let queue = app.getService(config.queue);
        let logger = config.logger && app.getService(config.logger);

        const pipeline = new Pipeline(store, queue, logger);
        app.registerService(FEATURE_NAME, pipeline);
    }
};