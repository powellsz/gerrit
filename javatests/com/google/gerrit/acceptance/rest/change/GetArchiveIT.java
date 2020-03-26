// Copyright (C) 2020 The Android Open Source Project
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package com.google.gerrit.acceptance.rest.change;

import static com.google.common.truth.Truth.assertThat;
import static com.google.gerrit.testing.GerritJUnit.assertThrows;

import com.google.gerrit.acceptance.AbstractDaemonTest;
import com.google.gerrit.acceptance.RestResponse;
import com.google.gerrit.extensions.client.ArchiveFormat;
import com.google.gerrit.extensions.restapi.BadRequestException;
import com.google.gerrit.extensions.restapi.MethodNotAllowedException;
import org.junit.Before;
import org.junit.Test;

public class GetArchiveIT extends AbstractDaemonTest {
  private String changeId;

  @Before
  public void setUp() throws Exception {
    changeId = createChange().getChangeId();
  }

  @Test
  public void formatNotSpecified() throws Exception {
    BadRequestException ex =
        assertThrows(
            BadRequestException.class,
            () -> gApi.changes().id(changeId).current().getArchive(null));
    assertThat(ex).hasMessageThat().isEqualTo("format is not specified");
  }

  @Test
  public void unknownFormat() throws Exception {
    // Test this by a REST call, since the Java API doesn't allow to specify an unknown format.
    RestResponse res =
        adminRestSession.get(
            String.format(
                "/changes/%s/revisions/current/archive?format=%s", changeId, "unknownFormat"));
    res.assertBadRequest();
    assertThat(res.getEntityContent()).isEqualTo("unknown archive format");
  }

  @Test
  public void zipFormatIsDisabled() throws Exception {
    MethodNotAllowedException ex =
        assertThrows(
            MethodNotAllowedException.class,
            () -> gApi.changes().id(changeId).current().getArchive(ArchiveFormat.ZIP));
    assertThat(ex).hasMessageThat().isEqualTo("zip format is disabled");
  }
}