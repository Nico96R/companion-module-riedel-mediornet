import {
  CompanionFeedbackDefinition,
  CompanionFeedbackDefinitions,
  combineRgb, InstanceBase
} from '@companion-module/base'
import {EmberClient} from 'emberplus-connection'
import {MediornetConfig} from "./config";
import {matrixnames, MediornetState} from "./state";
import {getInputChoices} from "./choices";

export enum FeedbackId {
  SourceBackgroundSelected = 'sourceBackgroundSelected',
  TargetBackgroundSelected = 'targetBackgroundSelected',
  SourceBackgroundRoutedVideo = 'sourceBackgroundRouted',
}

export function GetFeedbacksList(
  _self: InstanceBase<MediornetConfig>,
  _emberClient: EmberClient,
  state: MediornetState
): CompanionFeedbackDefinitions {
  const {inputChoices} = getInputChoices(state)
  const feedbacks: { [id in FeedbackId]: CompanionFeedbackDefinition | undefined } = {
    [FeedbackId.SourceBackgroundSelected]: {
      name: 'Source Background If Selected',
      description: 'Change Background of Source, when it is currently selected.',
      type: "boolean",
      defaultStyle: {
        // The default style change for a boolean feedback
        // The user will be able to customise these values as well as the fields that will be changed
        bgcolor: combineRgb(255, 0, 0),
        color: combineRgb(0, 0, 0),
      },
      options: [
        {
          type: 'number',
          label: 'Select Matrix Number',
          id: 'matrix',
          required: true,
          min: -0,
          max: 0xffffffff,
          default: 0
        },
        {
          type: 'number',
          label: 'Value',
          id: 'source',
          required: true,
          min: -0,
          max: 0xffffffff,
          default: 0
        }
      ],
      callback: (feedback) => {
        return state.selectedSource[Number(feedback.options['matrix'])] == feedback.options['source'];
      }
    },
    [FeedbackId.TargetBackgroundSelected]: {
      name: 'Target Background if Selected',
      description: 'Change Background of Target, when it is currently selected.',
      type: "boolean",
      defaultStyle: {
        // The default style change for a boolean feedback
        // The user will be able to customise these values as well as the fields that will be changed
        bgcolor: combineRgb(255, 0, 0),
        color: combineRgb(0, 0, 0),
      },
      options: [
        {
          type: 'number',
          label: 'Select Matrix Number',
          id: 'matrix',
          required: true,
          min: -0,
          max: 0xffffffff,
          default: 0
        },
        {
          type: 'number',
          label: 'Value',
          id: 'target',
          required: true,
          min: -0,
          max: 0xffffffff,
          default: 0
        }
      ],
      callback: (feedback) => {
        return (state.selectedDestination[Number(feedback.options['matrix'])] == feedback.options['target'])
      }
    },
    [FeedbackId.SourceBackgroundRoutedVideo]: {
      name: 'Source Background if routed on selected Target',
      description: 'Change Background of Source, when it is currently routed on the selected target.',
      type: "boolean",
      defaultStyle: {
        // The default style change for a boolean feedback
        // The user will be able to customise these values as well as the fields that will be changed
        bgcolor: combineRgb(255, 0, 0),
        color: combineRgb(0, 0, 0),
      },
      options: [
        {
          type: 'dropdown',
          label: 'Value',
          id: 'source',
          default: 0,
          minChoicesForSearch: 10,
          choices: inputChoices[matrixnames.video]
        }
      ],
      callback: (feedback) => {
        if (state.outputs == undefined ||
          state.outputs[matrixnames.video][state.selectedDestination[matrixnames.video]] == undefined ||
          state.outputs[matrixnames.video][state.selectedDestination[matrixnames.video]].route == undefined) return false
        return (feedback.options['source'] == state.outputs[matrixnames.video][state.selectedDestination[matrixnames.video]].route)
      }
    },
  }

  return feedbacks
}
