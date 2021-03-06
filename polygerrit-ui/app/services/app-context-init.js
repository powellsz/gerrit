/**
 * @license
 * Copyright (C) 2020 The Android Open Source Project
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import {appContext} from './app-context.js';
import {FlagsService} from './flags.js';
import {GrReporting} from './gr-reporting/gr-reporting.js';
import {EventEmitter} from './gr-event-interface/gr-event-interface.js';

const initializedServices = new Map();

function getService(serviceName, serviceInit) {
  if (!initializedServices.has(serviceName)) {
    initializedServices.set(serviceName, serviceInit());
  }
  return initializedServices.get(serviceName);
}

/**
 * The AppContext lazy initializator for all services
 */
export function initAppContext() {
  const registeredServices = {};
  function addService(serviceName, serviceCreator) {
    if (registeredServices[serviceName]) {
      throw new Error(`Service ${serviceName} already registered.`);
    }
    registeredServices[serviceName] = {
      get() {
        return getService(serviceName, serviceCreator);
      },
    };
  }

  addService('flagsService', () => new FlagsService());
  addService('reportingService',
      () => new GrReporting(appContext.flagsService));
  addService('eventEmitter', () => new EventEmitter());
  Object.defineProperties(appContext, registeredServices);
}
