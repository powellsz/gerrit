// Copyright (C) 2013 The Android Open Source Project
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

package com.google.gerrit.server.change;

import com.google.gerrit.common.Nullable;
import com.google.gerrit.entities.Change;
import com.google.gerrit.entities.Patch;
import com.google.gerrit.entities.PatchSet;
import com.google.gerrit.entities.Project;
import com.google.gerrit.extensions.client.DiffPreferencesInfo.Whitespace;
import com.google.gerrit.extensions.common.FileInfo;
import com.google.gerrit.extensions.restapi.ResourceConflictException;
import com.google.gerrit.server.patch.PatchList;
import com.google.gerrit.server.patch.PatchListCache;
import com.google.gerrit.server.patch.PatchListEntry;
import com.google.gerrit.server.patch.PatchListKey;
import com.google.gerrit.server.patch.PatchListNotAvailableException;
import com.google.inject.Inject;
import com.google.inject.Singleton;
import java.util.Map;
import java.util.TreeMap;
import java.util.concurrent.ExecutionException;
import org.eclipse.jgit.errors.NoMergeBaseException;
import org.eclipse.jgit.lib.ObjectId;

@Singleton
public class FileInfoJson {
  private final PatchListCache patchListCache;

  @Inject
  FileInfoJson(PatchListCache patchListCache) {
    this.patchListCache = patchListCache;
  }

  public Map<String, FileInfo> toFileInfoMap(Change change, PatchSet patchSet)
      throws ResourceConflictException, PatchListNotAvailableException {
    return toFileInfoMap(change, patchSet.commitId(), null);
  }

  public Map<String, FileInfo> toFileInfoMap(
      Change change, ObjectId objectId, @Nullable PatchSet base)
      throws ResourceConflictException, PatchListNotAvailableException {
    ObjectId a = base != null ? base.commitId() : null;
    return toFileInfoMap(change, PatchListKey.againstCommit(a, objectId, Whitespace.IGNORE_NONE));
  }

  public Map<String, FileInfo> toFileInfoMap(Change change, ObjectId objectId, int parent)
      throws ResourceConflictException, PatchListNotAvailableException {
    return toFileInfoMap(
        change, PatchListKey.againstParentNum(parent + 1, objectId, Whitespace.IGNORE_NONE));
  }

  private Map<String, FileInfo> toFileInfoMap(Change change, PatchListKey key)
      throws ResourceConflictException, PatchListNotAvailableException {
    return toFileInfoMap(change.getProject(), key);
  }

  public Map<String, FileInfo> toFileInfoMap(Project.NameKey project, PatchListKey key)
      throws ResourceConflictException, PatchListNotAvailableException {
    PatchList list;
    try {
      list = patchListCache.get(key, project);
    } catch (PatchListNotAvailableException e) {
      Throwable cause = e.getCause();
      if (cause instanceof ExecutionException) {
        cause = cause.getCause();
      }
      if (cause instanceof NoMergeBaseException) {
        throw new ResourceConflictException(
            String.format("Cannot create auto merge commit: %s", e.getMessage()), e);
      }
      throw e;
    }

    Map<String, FileInfo> files = new TreeMap<>();
    for (PatchListEntry e : list.getPatches()) {
      FileInfo d = new FileInfo();
      d.status =
          e.getChangeType() != Patch.ChangeType.MODIFIED ? e.getChangeType().getCode() : null;
      d.oldPath = e.getOldName();
      d.sizeDelta = e.getSizeDelta();
      d.size = e.getSize();
      if (e.getPatchType() == Patch.PatchType.BINARY) {
        d.binary = true;
      } else {
        d.linesInserted = e.getInsertions() > 0 ? e.getInsertions() : null;
        d.linesDeleted = e.getDeletions() > 0 ? e.getDeletions() : null;
      }

      FileInfo o = files.put(e.getNewName(), d);
      if (o != null) {
        // This should only happen on a delete-add break created by JGit
        // when the file was rewritten and too little content survived. Write
        // a single record with data from both sides.
        d.status = Patch.ChangeType.REWRITE.getCode();
        d.sizeDelta = o.sizeDelta;
        d.size = o.size;
        if (o.binary != null && o.binary) {
          d.binary = true;
        }
        if (o.linesInserted != null) {
          d.linesInserted = o.linesInserted;
        }
        if (o.linesDeleted != null) {
          d.linesDeleted = o.linesDeleted;
        }
      }
    }
    return files;
  }
}
