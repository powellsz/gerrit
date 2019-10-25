/**
 * @license
 * Copyright (C) 2016 The Android Open Source Project
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
(function() {
  'use strict';

  const ERR_COMMIT_NOT_FOUND =
      'Unable to find the commit hash of this change.';

  Polymer({
    is: 'gr-confirm-revert-submission-dialog',
    _legacyUndefinedCheck: true,

    /**
     * Fired when the confirm button is pressed.
     *
     * @event confirm
     */

    /**
     * Fired when the cancel button is pressed.
     *
     * @event cancel
     */

    properties: {
      message: String,
    },

    behaviors: [
      Gerrit.FireBehavior,
    ],

    populateRevertSubmissionMessage(message, commitHash) {
      // Follow the same convention of the revert
      const revertTitle = 'Revert submission';
      if (!commitHash) {
        this.fire('show-alert', {message: ERR_COMMIT_NOT_FOUND});
        return;
      }
      this.message = `${revertTitle}\n\n` +
          `Reason for revert: <INSERT REASONING HERE>\n`;
    },

    _handleConfirmTap(e) {
      e.preventDefault();
      e.stopPropagation();
      this.fire('confirm', null, {bubbles: false});
    },

    _handleCancelTap(e) {
      e.preventDefault();
      e.stopPropagation();
      this.fire('cancel', null, {bubbles: false});
    },
  });
})();
