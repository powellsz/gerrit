/**
 * @license
 * Copyright (C) 2017 The Android Open Source Project
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

import '../../../test/common-test-setup-karma.js';
import './gr-group.js';

const basicFixture = fixtureFromElement('gr-group');

suite('gr-group tests', () => {
  let element;

  let groupStub;
  const group = {
    id: '6a1e70e1a88782771a91808c8af9bbb7a9871389',
    url: '#/admin/groups/uuid-6a1e70e1a88782771a91808c8af9bbb7a9871389',
    options: {},
    description: 'Gerrit Site Administrators',
    group_id: 1,
    owner: 'Administrators',
    owner_id: '6a1e70e1a88782771a91808c8af9bbb7a9871389',
    name: 'Administrators',
  };

  setup(() => {
    stub('gr-rest-api-interface', {
      getLoggedIn() { return Promise.resolve(true); },
    });
    element = basicFixture.instantiate();
    groupStub = sinon.stub(
        element.$.restAPI,
        'getGroupConfig')
        .callsFake(() => Promise.resolve(group));
  });

  test('loading displays before group config is loaded', () => {
    assert.isTrue(element.$.loading.classList.contains('loading'));
    assert.isFalse(getComputedStyle(element.$.loading).display === 'none');
    assert.isTrue(element.$.loadedContent.classList.contains('loading'));
    assert.isTrue(getComputedStyle(element.$.loadedContent)
        .display === 'none');
  });

  test('default values are populated with internal group', done => {
    sinon.stub(
        element.$.restAPI,
        'getIsGroupOwner')
        .callsFake(() => Promise.resolve(true));
    element.groupId = 1;
    element._loadGroup().then(() => {
      assert.isTrue(element._groupIsInternal);
      assert.isFalse(element.$.visibleToAll.bindValue);
      done();
    });
  });

  test('default values with external group', done => {
    const groupExternal = Object.assign({}, group);
    groupExternal.id = 'external-group-id';
    groupStub.restore();
    groupStub = sinon.stub(
        element.$.restAPI,
        'getGroupConfig')
        .callsFake(() => Promise.resolve(groupExternal));
    sinon.stub(
        element.$.restAPI,
        'getIsGroupOwner')
        .callsFake(() => Promise.resolve(true));
    element.groupId = 1;
    element._loadGroup().then(() => {
      assert.isFalse(element._groupIsInternal);
      assert.isFalse(element.$.visibleToAll.bindValue);
      done();
    });
  });

  test('rename group', done => {
    const groupName = 'test-group';
    const groupName2 = 'test-group2';
    element.groupId = 1;
    element._groupConfig = {
      name: groupName,
    };
    element._groupName = groupName;

    sinon.stub(
        element.$.restAPI,
        'getIsGroupOwner')
        .callsFake(() => Promise.resolve(true));

    sinon.stub(
        element.$.restAPI,
        'saveGroupName')
        .callsFake(() => Promise.resolve({status: 200}));

    const button = element.$.inputUpdateNameBtn;

    element._loadGroup().then(() => {
      assert.isTrue(button.hasAttribute('disabled'));
      assert.isFalse(element.$.Title.classList.contains('edited'));

      element.$.groupNameInput.text = groupName2;

      assert.isFalse(button.hasAttribute('disabled'));
      assert.isTrue(element.$.groupName.classList.contains('edited'));

      element._handleSaveName().then(() => {
        assert.isTrue(button.hasAttribute('disabled'));
        assert.isFalse(element.$.Title.classList.contains('edited'));
        assert.equal(element._groupName, groupName2);
        done();
      });
    });
  });

  test('rename group owner', done => {
    const groupName = 'test-group';
    element.groupId = 1;
    element._groupConfig = {
      name: groupName,
    };
    element._groupConfigOwner = 'testId';
    element._groupOwner = true;

    sinon.stub(
        element.$.restAPI,
        'getIsGroupOwner')
        .callsFake(() => Promise.resolve({status: 200}));

    const button = element.$.inputUpdateOwnerBtn;

    element._loadGroup().then(() => {
      assert.isTrue(button.hasAttribute('disabled'));
      assert.isFalse(element.$.Title.classList.contains('edited'));

      element.$.groupOwnerInput.text = 'testId2';

      assert.isFalse(button.hasAttribute('disabled'));
      assert.isTrue(element.$.groupOwner.classList.contains('edited'));

      element._handleSaveOwner().then(() => {
        assert.isTrue(button.hasAttribute('disabled'));
        assert.isFalse(element.$.Title.classList.contains('edited'));
        done();
      });
    });
  });

  test('test for undefined group name', done => {
    groupStub.restore();

    sinon.stub(
        element.$.restAPI,
        'getGroupConfig')
        .callsFake(() => Promise.resolve({}));

    assert.isUndefined(element.groupId);

    element.groupId = 1;

    assert.isDefined(element.groupId);

    // Test that loading shows instead of filling
    // in group details
    element._loadGroup().then(() => {
      assert.isTrue(element.$.loading.classList.contains('loading'));

      assert.isTrue(element._loading);

      done();
    });
  });

  test('test fire event', done => {
    element._groupConfig = {
      name: 'test-group',
    };

    sinon.stub(element.$.restAPI, 'saveGroupName')
        .returns(Promise.resolve({status: 200}));

    const showStub = sinon.stub(element, 'dispatchEvent');
    element._handleSaveName()
        .then(() => {
          assert.isTrue(showStub.called);
          done();
        });
  });

  test('_computeGroupDisabled', () => {
    let admin = true;
    let owner = false;
    let groupIsInternal = true;
    assert.equal(element._computeGroupDisabled(owner, admin,
        groupIsInternal), false);

    admin = false;
    assert.equal(element._computeGroupDisabled(owner, admin,
        groupIsInternal), true);

    owner = true;
    assert.equal(element._computeGroupDisabled(owner, admin,
        groupIsInternal), false);

    owner = false;
    assert.equal(element._computeGroupDisabled(owner, admin,
        groupIsInternal), true);

    groupIsInternal = false;
    assert.equal(element._computeGroupDisabled(owner, admin,
        groupIsInternal), true);

    admin = true;
    assert.equal(element._computeGroupDisabled(owner, admin,
        groupIsInternal), true);
  });

  test('_computeLoadingClass', () => {
    assert.equal(element._computeLoadingClass(true), 'loading');
    assert.equal(element._computeLoadingClass(false), '');
  });

  test('fires page-error', done => {
    groupStub.restore();

    element.groupId = 1;

    const response = {status: 404};
    sinon.stub(
        element.$.restAPI, 'getGroupConfig').callsFake((group, errFn) => {
      errFn(response);
    });

    element.addEventListener('page-error', e => {
      assert.deepEqual(e.detail.response, response);
      done();
    });

    element._loadGroup();
  });

  test('uuid', () => {
    element._groupConfig = {
      id: '6a1e70e1a88782771a91808c8af9bbb7a9871389',
    };

    assert.equal(element._groupConfig.id, element.$.uuid.text);

    element._groupConfig = {
      id: 'user%2Fgroup',
    };

    assert.equal('user/group', element.$.uuid.text);
  });
});

