import {
  InstanceBase,
  InstanceStatus,
  runEntrypoint,
  SomeCompanionConfigField
} from '@companion-module/base'
import {GetActionsList} from './actions'
import {GetConfigFields, MediornetConfig} from './config'
import {GetFeedbacksList} from './feedback'
import {EmberClient} from 'emberplus-connection' // note - emberplus-conn is in parent repo, not sure if it needs to be defined as dependency
import {MediornetState} from "./state";
import {initVariables} from "./variables";

/**
 * Companion instance class for Riedels Mediornet Devices
 */
export class MediornetInstance extends InstanceBase<MediornetConfig> {
  public emberClient!: EmberClient
  config!: MediornetConfig
  private state!: MediornetState


  // Override base types to make types stricter
  public checkFeedbacks(...feedbackTypes: string[]): void {
    // todo - arg should be of type FeedbackId
    super.checkFeedbacks(...feedbackTypes)
  }

  /**
   * Main initialization function called once the module
   * is OK to start doing things.
   */
  public async init(config: MediornetConfig): Promise<void> {
    this.config = config
    this.state = new MediornetState(this)

    this.state.updateCounts(this.config)
    await this.setupEmberConnection()

  }

  /**
   * Process an updated configuration array.
   */
  public async configUpdated(config: MediornetConfig): Promise<void> {
    this.config = config

    this.emberClient.discard()
    this.emberClient.removeAllListeners()

    await this.setupEmberConnection()
  }

  /**
   * Creates the configuration fields for web config.
   */
  public getConfigFields(): SomeCompanionConfigField[] {
    return GetConfigFields()
  }

  /**
   * Clean up the instance before it is destroyed.
   */
  public async destroy(): Promise<void> {
    this.emberClient.discard()
  }

  public updateCompanionBits(): void {
    this.setActionDefinitions(GetActionsList(this, this.client, this.config, this.state))
    this.setFeedbackDefinitions(GetFeedbacksList(this, this.client, this.state))
    initVariables(this, this.state);

  }// end updateCompanionBits


  private get client(): EmberClient {
    return this.emberClient
  }

  private async setupEmberConnection(): Promise<void> {
    this.log('debug', 'connecting ' + (this.config.host || '') + ':' + 9000)
    this.updateStatus(InstanceStatus.Connecting)

    this.emberClient = new EmberClient(this.config.host || '', 9000, 10000)
    this.emberClient.on('error', (e) => {
      this.log('error', 'Error ' + e)
    })
    this.emberClient.on('connected', () => {
      Promise.resolve()
        .then(async () => {
          const request = await this.emberClient.getDirectory(this.emberClient.tree)
          await request.response
          await this.state.subscribeMediornet()
          this.updateCompanionBits()
        })
        .catch((e) => {
          // get root
          this.log('error', 'Failed to discover root: ' + e)
        })
      this.updateStatus(InstanceStatus.Ok)
    })
    this.emberClient.on('disconnected', () => {
      this.updateStatus(InstanceStatus.Connecting)
    })
    await this.emberClient.connect().catch((e) => {
      this.updateStatus(InstanceStatus.ConnectionFailure)
      this.log('error', 'Error ' + e)
    })
    this.updateCompanionBits()
  }
}

runEntrypoint(MediornetInstance, [])
