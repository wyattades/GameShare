import $ from 'jquery';

import typeTemplate from '../templates/type.pug';
import objectTemplate from '../templates/object.pug';
import Engine from './EditorEngine';

let data,
    app;

const getLevelData = () => {

  

  return data;
};

const removeObject = () => {

};

const addObject = (objData, appGroup, $type) => {
  const groupData = data.groups[objData.group];

  // TEMP ???
  if (groupData.stroke) objData.stroke = groupData.stroke;
  if (groupData.fill) objData.fill = groupData.fill;
  
  const newObj = app.addWall(appGroup, objData);
  objData = {
    ...objData,
    x: newObj.x,
    y: newObj.y,
    w: newObj.hitArea.width,
    h: newObj.hitArea.height,
  };

  data.objects.push(objData);
  const objId = data.objects.length - 1;

  groupData.objects.push(objId);

  const objectHTML = objectTemplate(objData);
  const $obj = $(objectHTML).insertAfter($type);

  newObj.onUpdate = newData => {
    Object.assign(objData, newData);
    const { x, y, w, h } = objData;
    $obj.find('.object-button').text(`x:${x}, y:${y}, w:${w}, h:${h}`);
  };
};

const removeGroup = () => {
  if (data.groups.length <= 1) {
    alert('You must have atleast one group!');
    return;
  }

  console.log('Remove');
};

const addGroup = (groupData) => {
  const objects = groupData.objects || [];
  groupData.objects = [];
  
  const appGroup = app.addGroup(groupData);

  data.groups.push(groupData);
  const groupId = data.groups.length - 1;

  const typeHTML = typeTemplate(groupData);
  const $type = $(typeHTML).insertBefore('#new-buttons');

  // Add initial objects for group
  for (let objIndex of objects) {
    addObject(data.objects[objIndex], appGroup, $type);
  }

  $type.on('click', '.new-object-button', () => {
    addObject({ group: groupId }, appGroup, $type);
  });
};

const initData = () => {
  
  $('#game-name').val(data.name || '');
  
  data.objects = data.objects || [];
  const groups = data.groups || [];
  data.groups = [];
  // Add initial groups
  for (let group of groups) {
    addGroup(group);
  }
};

// Create editor
module.exports = (initialData, saveGame) => {

  // Store reference to game data
  data = initialData;

  // Initiate object editor view
  app = new Engine($('#root').get(0), initialData.options);
  app.start();

  // Populate editor engine and html with groups and objects
  initData();

  // Save new game data to database
  const onSaveGame = newStatus => e => {
    $(e.target).addClass('is-loading');

    const gameData = getLevelData();
    
    // Get game name from header input
    const name = $('#game-name').val();

    if (name.length === 0) {
      window.alert('Please provide a name for your game');
      $(e.target).removeClass('is-loading');
      return;
    }

    // Update game and info data with new name
    gameData.name = name;
    const infoData = {
      name,
    };
    if (newStatus) infoData.status = newStatus;

    saveGame(gameData, infoData)
    .then(() => {
      $(e.target).removeClass('is-loading');
    });
  };

  // Bind save/publish actions:

  $('#publish').click(onSaveGame('running'));

  $('#save').click(onSaveGame());

  // $(document).on('click', '#new-object-button', (event) => {
  //   let objGroup = $(event.currentTarget).parent().prop('id');
  //   addObject(objGroup);
  // });

  $(document).on('click', '.object-button', (event) => {
    $('.object-button').parent().css('background-color', 'white');
    $('.group').css('background-color', 'white');

    $(event.currentTarget).parent().css('background-color', '#50e283');
    $('.object-settings').css('display', 'block');

    $(event.currentTarget)
    .parent()
    .prevAll('.group')
    .first()
    .css('background-color', '#bdf4d0');

    if ($('.type-settings').css('display') === 'block') {
      $('.type-settings').css('display', 'none');
    }
  });

  $(document).on('click', '.group', (event) => {
    $('.group').css('background-color', 'white');
    $('.object-button').parent().css('background-color', 'white');

    $('.type-settings').css('display', 'block');
    $(event.currentTarget).css('background-color', '#50e283');

    if ($('.object-settings').css('display') === 'block') {
      $('.object-settings').css('display', 'none');
    }
  });

  $('#new-type-button').click(() => {
    let name = prompt('Enter new object type name:');

    if (name) {
      addGroup({ name });
    }
  });

  // Handles displaying content for editor tabs
  // TODO: do this without iteration (using jquery magic)
  const tabs = ['object', 'grid', 'level'];
  for (let tab of tabs) {
    $(`#${tab}-tab`).click(() => {
      for (let _tab of tabs) {
        if (tab === _tab) {
          $(`#${_tab}-tab`).addClass('is-active');
          $(`.${_tab}-block`).css('display', 'flex');
        } else {
          $(`#${_tab}-tab`).removeClass('is-active');
          $(`.${_tab}-block`).css('display', 'none');
        }
      }
    });
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

  $('#background-color').change(() => {
    app.setOptions({ backgroundColor: $('#background-color').val() });
  });
};
