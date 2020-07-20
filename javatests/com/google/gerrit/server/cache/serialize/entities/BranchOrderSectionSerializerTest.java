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

package com.google.gerrit.server.cache.serialize.entities;

import static com.google.common.truth.Truth.assertThat;
import static com.google.gerrit.server.cache.serialize.entities.BranchOrderSectionSerializer.deserialize;
import static com.google.gerrit.server.cache.serialize.entities.BranchOrderSectionSerializer.serialize;

import com.google.common.collect.ImmutableList;
import com.google.gerrit.entities.BranchOrderSection;
import org.junit.Test;

public class BranchOrderSectionSerializerTest {
  @Test
  public void roundTrip() {
    BranchOrderSection autoValue = BranchOrderSection.create(ImmutableList.of("master", "stable"));
    assertThat(deserialize(serialize(autoValue))).isEqualTo(autoValue);
  }
}