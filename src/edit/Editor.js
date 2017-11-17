import $ from 'jquery';

import typeTemplate from '../templates/type.pug';
import objectTemplate from '../templates/object.pug';
import Engine from './EditorEngine';

let data,
    app;

let selected = {};

const intToHex = int => {
  const hexString = `000000${((int) >>> 0).toString(16)}`.slice(-6);
  return `#${hexString}`;
};

const hexToInt = hex => {
  return parseInt(hex.substring(1), 16);
};

const highlightSelected = ($group, $obj) => {

  selected = {};

  $('.object-block').css('background-color', 'white');

  if (!$group) {
    $('#type-settings').css('display', 'none');
    $('#object-settings').css('display', 'none');
    return;
  }

  selected.$group = $group;
  selected.groupId = $group.data('id');
  selected.groupData = data.groups[selected.groupId];

  $('#type-settings').css('display', 'block');
  $('#type-color').val(intToHex(selected.groupData.fill));
  
  if ($obj) {
    $('#object-settings').css('display', 'block');
    $group.css('background-color', '#bdf4d0');
    $obj.css('background-color', '#50e283');
    
    selected.$obj = $obj;
    selected.objId = $obj.data('id');
    selected.objData = data.objects[selected.objId];

    $('#object-color').val(selected.objData.fill && intToHex(selected.objData.fill));

  } else {
    $('#object-settings').css('display', 'none');
    $group.css('background-color', '#50e283');
    
  }
};

const deleteSelected = () => {

  if (selected.objData) {
    selected.$obj.remove();

    delete selected.groupData.objects[selected.objId];
    delete data.objects[selected.objId];
    
    // TEMP
    app.selectedObject.destroy();

    highlightSelected(selected.$group);
    return;
  }

  if (selected.$group) {

    if (data.groups.length <= 1) {
      alert('Sorry, you must have atleast one group!');
      return;
    }

    selected.$group.remove();

    const objIds = selected.groupData.objects;
    for (let objId in objIds) {
      if (objIds.hasOwnProperty(objId)) delete data.objects[objId];
    }
    delete data.groups[selected.groupId];

    // TEMP: I don't want to have to store id in EditorEngine
    for (let appGroup of app.container.children) {
      if (appGroup.id === selected.groupId) {
        appGroup.destroy();
        break;
      }
    }

    highlightSelected();
  }
};

const addObject = (objId, objData, appGroup, $group) => {

  if (objId === null) {
    objId = data.objGen++;
    data.objects[objId] = objData;
  }

  const groupData = data.groups[objData.group];
  
  const appObj = app.addWall(appGroup, groupData, objData);

  groupData.objects[objId] = true;

  const objectHTML = objectTemplate(objData);
  const $obj = $(objectHTML).insertAfter($group);
  $obj.data('id', objId);

  const selectObject = () => {
    highlightSelected($group, $obj);
    app.selectObject(appObj);
  };

  $obj.click(selectObject);

  // TODO: only need to handle update for selected object?
  appObj.onUpdate = newData => {

    if (newData.selected) {
      selectObject();
      return;
    }

    Object.assign(objData, newData);
    const { x, y, w, h } = objData;
    $obj.find('.object-button').text(`x:${x}, y:${y}, w:${w}, h:${h}`);
  };
};

const addGroup = (groupId, groupData) => {
  
  if (groupId === null) {
    groupId = data.groupGen++;
    data.groups[groupId] = groupData;
  }

  const appGroup = app.addGroup(groupData, groupId);

  const typeHTML = typeTemplate(groupData);
  const $group = $(typeHTML).insertBefore('#new-buttons');
  $group.data('id', groupId);

  $group.click(() => {
    highlightSelected($group);
    app.clearSelection();
  });

  // Add initial objects for group
  groupData.objects = groupData.objects || {};
  for (let objId in groupData.objects) {
    if (groupData.objects.hasOwnProperty(objId)) {
      addObject(objId, data.objects[objId], appGroup, $group);
    }
  }

  $group.on('click', '.new-object-button', () => {
    addObject(null, { group: groupId }, appGroup, $group);
  });
};

const initData = (initialData) => {
  data = initialData;

  console.log(data);
  
  $('#game-name').val(data.name || '');
  
  data.objects = data.objects || {};
  data.groups = data.groups || {};

  // Add initial groups
  for (let groupId in data.groups) {
    if (data.groups.hasOwnProperty(groupId)) {
      addGroup(groupId, data.groups[groupId]);
    }
  }
};

// Create editor
module.exports = (initialData, saveGame) => {

  // Initiate object editor view
  app = new Engine($('#root').get(0), initialData.options);
  app.start();

  // Populate editor engine and html with groups and objects
  initData(initialData);

  // Save new game data to database
  const onSaveGame = newStatus => e => {
    $(e.target).addClass('is-loading');
    
    // Get game name from header input
    const name = $('#game-name').val();

    if (name.length === 0) {
      window.alert('Please provide a name for your game');
      $(e.target).removeClass('is-loading');
      return;
    }

    // Update game and info data with new name
    data.name = name;
    const infoData = {
      name,
    };
    if (newStatus) infoData.status = newStatus;

    saveGame(data, infoData)
    .then(() => {
      $(e.target).removeClass('is-loading');
    });
  };

  // Bind save/publish actions:

  $('#publish').click(onSaveGame('running'));

  $('#save').click(onSaveGame());

  // Get grid selected
  app.container.onUpdate = ({ selected: _selected }) => {
    if (_selected) {
      highlightSelected();
    }
  };
  
  // Other input actions

  $('#new-type-button').click(() => {
    let name = prompt('Enter new object type name:');

    if (name) {
      addGroup(null, {
        name,
      });
    }
  });

  // Handles displaying content for editor tabs
  // TODO: do this without iteration (using jquery magic)
  const tabs = ['object', 'grid', 'level'];
  const onClickTab = tab => () => {
    app.clearSelection();
    highlightSelected();

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

  function resizeGrid() {
    let boundary_x = $('#boundary-x').val(),
        boundary_y = $('#boundary-y').val(),
        snap_input = $('#snap-input').val();
    app.resizeGrid(boundary_x, boundary_y, snap_input);
  }
  $('#snap-input').change(resizeGrid);
  $('#boundary-x').change(resizeGrid);
  $('#boundary-y').change(resizeGrid);

  function setBackgroundColor(color) {
    $('#root').css('background-color', `${color}4D`);
    app.setOptions({ backgroundColor: hexToInt(color) });
  }

  let color = intToHex(data.options.backgroundColor);
  $('#background-color').val(color);
  setBackgroundColor(color);

  $('#background-color').change(() => {
    let newColor = $('#background-color').val();
    setBackgroundColor(newColor);
  });

  $('#type-color').change(function onChange() {
    selected.groupData.fill = hexToInt($(this).val());
  });

  $('#type-rename').click(() => {
    const name = prompt('New type name:');
    selected.groupData.name = name;
    selected.$group.find('.type-name').text(name);
  });

  $('#type-delete').click(() => {
    if (confirm('Are you sure?')) {
      deleteSelected();
    }
  });

  $('#object-color').change(function onChange() {
    selected.objData.fill = hexToInt($(this).val());
  });

  $('#object-delete').click(() => {
    deleteSelected();
  });
};
