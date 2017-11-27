import $ from 'jquery';

import typeTemplate from '../templates/type.pug';
import objectTemplate from '../templates/object.pug';
import EE from './EventEmitter';
import { hexToInt, intToHex } from '../utils/helpers';

const events = new EE();

const select = (groupId, objId, groupData, objData) => {

  const $group = groupId && $(`.group[data-group='${groupId}']`),
        $obj = objId && $(`.object[data-obj='${objId}']`);

  $('.object-block').removeClass('selected secondary-selected');

  if (!$group) {
    $('#type-settings').hide();
    $('#object-settings').hide();
    $('#grid-settings').show();
    return;
  }

  $('#grid-settings').hide();

  $('#type-color')
  .val(intToHex(groupData.fill))
  .off().change(e => {
    events.emit('update-group', groupId, {
      fill: hexToInt(e.target.value),
    });
  });

  $('#type-rename')
  .off().click(() => {
    const name = prompt('New type name:');
    
    if (name) {
      $group.find('.type-name').text(name);
      events.emit('update-group', groupId, {
        name,
      });
    }
  });

  $('#type-delete')
  .off().click(() => {

    if ($('.group').length <= 1) {
      alert('Must have atleast one group.');
      return;
    }

    if (confirm('Are you sure?')) {
      events.emit('remove-group', groupId);
    }
  });
  
  if ($obj) {
    $('#object-settings').show();
    $('#type-settings').hide();
    $group.addClass('secondary-selected');
    $obj.addClass('selected');
    
    for (let key of ['x', 'y', 'w', 'h']) {
      $(`#object-${key}`)
      .val(objData[key])
      .off().change(e => {
        events.emit('update-object', groupId, objId, {
          [key]: parseFloat(e.target.value),
        });
      });
    }
  
    $('#object-color')
    .val(intToHex(objData.fill))
    .off().change(e => {
      events.emit('update-object', groupId, objId, {
        fill: hexToInt(e.target.value),
      });
    });
  
    $('#object-delete')
    .off().click(() => {
      events.emit('remove-object', groupId, objId);
    });

    $('#object-duplicate')
    .off().click(() => {
      const newObjData = { ...objData };
      newObjData.x += 10; // TODO: use snap instead of 10
      newObjData.y += 10;
      events.emit('add-object', groupId, groupData, null, newObjData);
    });
    
  } else {
    $('#type-settings').show();
    $('#object-settings').hide();
    $group.addClass('selected');
  }
};

// Handles displaying content for editor tabs
// TODO: do this without iteration (using jquery magic)
const tabs = ['objects', 'level'];
const onClickTab = tab => () => {
  
  for (let _tab of tabs) {
    if (tab === _tab) {
      $(`#${_tab}-tab`).addClass('is-active');
      $(`#${_tab}-settings`).show();
    } else {
      $(`#${_tab}-tab`).removeClass('is-active');
      $(`#${_tab}-settings`).hide();
    }
  }
};
for (let tab of tabs) {
  $(`#${tab}-tab`).click(onClickTab(tab));
}

const addObject = (groupId, groupData, objId, objData) => {

  const $group = $(`.group[data-group='${groupId}']`);
  
  const objectHTML = objectTemplate(objData);
  
  $(objectHTML)
  .insertAfter($group)
  .attr('data-obj', objId)
  .attr('data-group', groupId)
  .click(() => events.emit('select', groupId, objId));
};

const addGroup = (groupId, groupData) => {

  const groupHTML = typeTemplate(groupData);

  $(groupHTML)
  .appendTo('#object-list')
  .attr('data-group', groupId)
  .click(() => events.emit('select', groupId))
  .on('click', '.new-rect-button', () => {
    events.emit('add-object', groupId, groupData, null, {
      group: groupId,
      shape: 'rect',
    });
  })
  .on('click', '.new-ellip-button', () => {
    events.emit('add-object', groupId, groupData, null, {
      group: groupId,
      shape: 'ellipse',
    });
  });
};

const listeners = {
  
  'add-object': addObject,

  'add-group': addGroup,

  'remove-group': (groupId) => {
    $(`[data-group='${groupId}']`).remove();
  },

  'remove-object': (groupId, objId) => {
    $(`.object[data-obj='${objId}']`).remove();
  },

  'update-object': (groupId, objId, newData) => {
    const $el = $(`.object[data-obj='${objId}'] .object-button`);
    let text = $el.text();
    for (let key in newData) {
      text = text.replace(new RegExp(`${key}:.*?,`), `${key}: ${newData[key]},`);
    }
    $el.text(text);

    for (let key in newData) {
      $(`#object-${key}`).val(newData[key]);
    }
  },

  'update-option': (key, val, keyDeep) => {
    const $el = $(`#opt-${key}${keyDeep ? `-${keyDeep}` : ''}`);
    $el.val($el.attr('type') === 'color' && typeof val === 'number' ? intToHex(val) : val);
  },

  // 'update-group': (groupId, newData) => {

  // },

  'set-name': (name) => {
    $('#game-name').val(name);
  },

  'history-limit': (limitUndo, limitRedo) => {
    $('#undo').attr('disabled', limitUndo);
    $('#redo').attr('disabled', limitRedo);
  },

  select,

  'save-state': (state) => {
    if (state === 'saving') {
      $('#save span:last-child').text('Saving');
      $('#save i.fa').addClass('fa-refresh fa-spin').removeClass('fa-check');
    } else if (state === 'saved') {
      $('#save span:last-child').text('Saved');
      $('#save i.fa').addClass('fa-check').removeClass('fa-refresh fa-spin');
    }
  },

};

const updateOption = (option, subOption) => e => {
  let val = e.target.value;
  if (e.target.type === 'number' && typeof val !== 'number') val = parseFloat(val);
  else if (e.target.type === 'color' && typeof val === 'string') val = hexToInt(val);

  events.broadcast('update-option', option, val, subOption);
};

const bindOptionChange = (option, initialValue, subOption) => {
  const $el = $(`#opt-${option}${subOption ? `-${subOption}` : ''}`);

  $el
  .val($el.attr('type') === 'color' && typeof initialValue === 'number' ? intToHex(initialValue) : initialValue)
  .change(updateOption(option, subOption));
};

const init = (options) => {

  const $name = $('#game-name')
  .val(options.name || 'Untitled Game')
  .change(e => {
    const val = e.target.value;
    if (!val || val.length === 0) {
      $name.val('Untitled Game');
    } else {
      events.emit('set-name', val);
    }
  });

  $('#publish').click(() => events.emit('publish'));

  for (let option in options) {
    const val = options[option];
    if (typeof val !== 'object') {
      bindOptionChange(option, val);
    } else {
      for (let subOption in val) {
        bindOptionChange(option, val[subOption], subOption);
      }
    }
  }

  $('#new-type-button').click(() => {
    const name = prompt('Enter new object type name:');

    if (name) {
      // TODO: don't use middleware to create id?
      events.emit('add-group', null, {
        name,
        fill: 0xAAAAAA,
      });
    }
  });

  $('#undo')
  .attr('disabled', true)
  .click(() => events.emit('history', -1));

  $('#redo')
  .attr('disabled', true)
  .click(() => events.emit('history', 1));

};

export default _data => {

  init(_data);
  
  for (let event in listeners) {
    events.on(event, listeners[event]);
  }
};
