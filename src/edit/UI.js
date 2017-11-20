import $ from 'jquery';

import typeTemplate from '../templates/type.pug';
import objectTemplate from '../templates/object.pug';
import EE from './EventEmitter';

const events = new EE();

// Helper functions for converting: hex color string <--> color integer
const intToHex = int => {
  const hexString = `000000${((int) >>> 0).toString(16)}`.slice(-6);
  return `#${hexString}`;
};
const hexToInt = hex => parseInt(hex.substring(1), 16);

const select = (groupId, objId, groupData, objData) => {

  const $group = groupId && $(`.group[data-group='${groupId}']`),
        $obj = objId && $(`.object[data-obj='${objId}']`);

  $('.object-block').css('background-color', 'white');

  if (!$group) {
    $('#type-settings').css('display', 'none');
    $('#object-settings').css('display', 'none');
    return;
  }

  $('#type-settings').css('display', 'block');

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

    $('#object-settings').css('display', 'block');
    $group.css('background-color', '#bdf4d0');
    $obj.css('background-color', '#50e283');
  
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
  } else {
    $('#object-settings').css('display', 'none');
    $group.css('background-color', '#50e283');
  }
};

// Handles displaying content for editor tabs
// TODO: do this without iteration (using jquery magic)
const tabs = ['object', 'grid', 'level'];
const onClickTab = tab => () => {
  events.emit('select');

  for (let _tab of tabs) {
    if (tab === _tab) {
      $(`#${_tab}-tab`).addClass('is-active');
      $(`.${_tab}-block`).css('display', 'flex');
    } else {
      $(`#${_tab}-tab`).removeClass('is-active');
      $(`.${_tab}-block`).css('display', 'none');
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
  .insertBefore('#new-buttons')
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
  },

  // 'update-group': (groupId, newData) => {
    
  // },

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
  const val = e.target.type === 'number' && e.target.value !== 'number' ? parseInt(e.target.value, 10) : e.target.value;
  events.broadcast('update-option', option, val, subOption);
};

const bindOptionChange = (option, initialValue, subOption) => {
  $(`#opt-${option}${subOption ? `-${subOption}` : ''}`)
  .val(initialValue)
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

  // Only allow number inputs to be multiples of snap
  // $('#opt-snap').change(e => {
  //   $('snap-numbers').attr('snap', e.target.value);
  // });
    
  $('#new-type-button').click(() => {
    let name = prompt('Enter new object type name:');

    if (name) {
      // TODO: don't use middleware to create id?
      events.emit('add-group', null, {
        name,
        fill: 0xAAAAAA,
      });
    }
  });

};

export default _data => {

  init(_data);
  
  for (let event in listeners) {
    events.on(event, listeners[event]);
  }
};
