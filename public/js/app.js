const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
const GAME_PADDING = 10;
const BOX_SIZE = 50;
const BOX_PADDING = 5;

class Box {
  
  constructor(game, { x, y, lineLeft, lineTop, lineRight, lineBottom }) {    
    this.game = game;
    this.x = x;
    this.y = y;
    this.lineLeft = lineLeft;
    this.lineTop = lineTop;
    this.lineRight = lineRight;
    this.lineBottom = lineBottom;
    
    this.player = null;
    
    this.lineLeft.addListener(({ player }) => this.onLineClick({ player }));
    this.lineTop.addListener(({ player }) => this.onLineClick({ player }));
    this.lineRight.addListener(({ player }) => this.onLineClick({ player }));
    this.lineBottom.addListener(({ player }) => this.onLineClick({ player }));
    
    this.$scribble = document.createElementNS(SVG_NAMESPACE, 'svg');
    this.$scribble.setAttribute('x', BOX_PADDING + GAME_PADDING + x * BOX_SIZE);
    this.$scribble.setAttribute('y', BOX_PADDING + GAME_PADDING + y * BOX_SIZE);
    this.$scribble.setAttribute('width', BOX_SIZE - BOX_PADDING - BOX_PADDING);
    this.$scribble.setAttribute('height', BOX_SIZE - BOX_PADDING - BOX_PADDING);
    this.$scribble.classList.add('scribble');
    this.$scribble.setAttribute('viewBox', `-50 -50 1700 1400`);
    this.game.$svg.appendChild(this.$scribble);
    
    // Scribble effect source: http://thenewcode.com/1062/Scribble-Image-Reveal-with-SVG-and-Blend-Modes
    this.$scribblePolyline = document.createElementNS(SVG_NAMESPACE, 'polyline');
    this.$scribblePolyline.setAttribute('points', '0,154 131,0 0,348 269,0 0,562 437,0 0,766 565,14 0,1062 719,0 289,1062 843,0 543,1062 995,0 729,1062 1161,0 947,1062 1307,0 1143,1062 1500,162 1299,1062 1500,830');
    this.$scribble.appendChild(this.$scribblePolyline);
  }
  
  onLineClick({ player }) {    
    if( this.lineLeft.player 
     && this.lineTop.player
     && this.lineRight.player
     && this.lineBottom.player ) {
      this.player = player;
      
      this.$scribblePolyline.style.strokeWidth = 75 + Math.random() * 50;
      this.$scribblePolyline.style.stroke = this.game.players[player].color;
      this.$scribble.classList.add('visible');
      
      return true;
    }
    
    return false;    
  }
  
}

class Line {
  
  constructor(game, { x, y, onClick }) {
    this.game = game;
    this.x = x;
    this.y = y;
    this.onClick = onClick;
    
    this.player = null;
    this.listeners = [];
    
    this.$line = document.createElementNS(SVG_NAMESPACE, 'line');
    this.$line.classList.add('line');
    this.$line.addEventListener('click', () => this.onClick());
    this.game.$svg.appendChild(this.$line);
    
    if( this instanceof LineHorizontal ) {
      this.$line.setAttribute('x1', GAME_PADDING + x * BOX_SIZE + 5);
      this.$line.setAttribute('x2', GAME_PADDING + x * BOX_SIZE + BOX_SIZE - 5);
      this.$line.setAttribute('y1', GAME_PADDING + y * BOX_SIZE);
      this.$line.setAttribute('y2', GAME_PADDING + y * BOX_SIZE);
      
      // Most right column
      if( this.y === this.game.width - 1 ) {
        const $dot = document.createElementNS(SVG_NAMESPACE, 'circle');
        $dot.classList.add('dot');
        $dot.setAttribute('cx', GAME_PADDING + this.x * BOX_SIZE + BOX_SIZE);
        $dot.setAttribute('cy', GAME_PADDING + this.y * BOX_SIZE);
        $dot.setAttribute('r', 2);
        this.game.$svg.appendChild($dot);
      }

    } else if( this instanceof LineVertical ) {
      this.$line.setAttribute('x1', GAME_PADDING + x * BOX_SIZE);
      this.$line.setAttribute('x2', GAME_PADDING + x * BOX_SIZE);
      this.$line.setAttribute('y1', GAME_PADDING + y * BOX_SIZE + 5);
      this.$line.setAttribute('y2', GAME_PADDING + y * BOX_SIZE + BOX_SIZE - 5);
    
      // Most bottom row
      if( this.y === this.game.width - 1 ) {
        const $dot = document.createElementNS(SVG_NAMESPACE, 'circle');
        $dot.classList.add('dot');
        $dot.setAttribute('cx', GAME_PADDING + this.x * BOX_SIZE);
        $dot.setAttribute('cy', GAME_PADDING + this.y * BOX_SIZE + BOX_SIZE);
        $dot.setAttribute('r', 2);
        this.game.$svg.appendChild($dot);
      }
    }
    
    const $dot = document.createElementNS(SVG_NAMESPACE, 'circle');
    $dot.classList.add('dot');
    $dot.setAttribute('cx', GAME_PADDING + this.x * BOX_SIZE);
    $dot.setAttribute('cy', GAME_PADDING + this.y * BOX_SIZE);
    $dot.setAttribute('r', 2);
    this.game.$svg.appendChild($dot);
  }
  
  addListener(fn) {
    this.listeners.push(fn);
  }
  
  setPlayer(playerId) {
    if( this.player ) return;
    this.player = playerId;
    const boxWasClosed = this.listeners.some(listener => listener({
      player: playerId,
    }));
        
    this.$line.classList.add('taken');
    this.$line.style.stroke = this.game.players[this.player].color;
    //this.$line.style.stroke = 'white';
    
    this.game.nextTurn({
      nextPlayer: !boxWasClosed,
    });
    
  }
  
  onClick() {
    if( this.player ) return;
    this.setPlayer(this.game.player);
    this.onClick();
  }
  
}

class LineHorizontal extends Line {
  
}

class LineVertical extends Line {
  
}

class Game {
  
  constructor($el, {
    width = 2,
    height = 2,
    players = [],
    onTurn,
  }) {
    this.$el = $el;
    this.$svg = this.$el.querySelector('svg');
    this.$status = this.$el.querySelector('#game-status');
    this.$winner = this.$el.querySelector('#game-winner');
    
    this.width = width;
    this.height = height;
    this.players = players;
    this.player = 0;
    this.winner = null;
    this.onTurn = onTurn;
    
    this.lines = {
      // Horizontal
      h: [
        /*
          [ Line, Line, Line ]
          [ Line, Line, Line ]
          [ Line, Line, Line ]
          [ Line, Line, Line ]
        */
      ],
      
      // Vertical
      v: [
        /*
          [ Line, Line, Line ]
          [ Line, Line, Line ]
          [ Line, Line, Line ]
          [ Line, Line, Line ]
        */
      ],
    };
    this.boxes = [
      /*
      [ Box, Box, Box, ]
      [ Box, Box, Box, ]
      [ Box, Box, Box, ]
      */
    ];
    
    // Create Boxes & Lines
    for( let x = 0; x < this.width; x++ ) {
      for( let y = 0; y < this.height; y++ ) {
        this.lines['h'][x] = this.lines['h'][x] || [];
        const lineTop = this.lines['h'][x][y] = this.lines['h'][x][y] || new LineHorizontal(this, {
          x,
          y,
          onClick: () => this.onTurn({ direction: 'h', x, y }),
        });
        
        this.lines['h'][x] = this.lines['h'][x] || [];
        const lineBottom = this.lines['h'][x][y + 1] = this.lines['h'][x][y + 1] || new LineHorizontal(this, {
          x,
          y: y + 1,
          onClick: () => this.onTurn({ direction: 'h', x, y: y + 1 }),
        });
        
        this.lines['v'][x] = this.lines['v'][x] || [];
        const lineLeft = this.lines['v'][x][y] = this.lines['v'][x][y] || new LineVertical(this, {
          x,
          y,
          onClick: () => this.onTurn({ direction: 'v', x, y }),
        });
        
        this.lines['v'][x + 1] = this.lines['v'][x + 1] || [];
        const lineRight = this.lines['v'][x + 1][y] = this.lines['v'][x + 1][y] || new LineVertical(this, {
          x: x + 1,
          y,
          onClick: () => this.onTurn({ direction: 'v', x: x + 1, y }),
        });
        
        this.boxes[y] = this.boxes[y] || [];
        this.boxes[y][x] = new Box(this, {
          x,
          y,
          lineTop,
          lineBottom,
          lineLeft,
          lineRight,
        });
      }
    }
    
    // Set Viewbox
    this.$svg.setAttribute('viewBox', `0 0 ${width * BOX_SIZE + GAME_PADDING + GAME_PADDING} ${height * BOX_SIZE + GAME_PADDING + GAME_PADDING}`);
  }
  
  nextTurn({ nextPlayer = true } = {}) {
    let allBoxesTaken = true;
    this.boxes.forEach(row => {
      row.forEach(box => {
        if( !box.player ) {
          allBoxesTaken = false;
        }
      });
    });
    
    const scores = {};
    this.boxes.forEach(row => {
      row.forEach(box => {
        if( !box.player ) return;
        scores[box.player] = scores[box.player] || 0;
        scores[box.player]++;
      });
    });
    console.log(scores)
    
    if( allBoxesTaken ) {
      if( players[0].score > players[1].score ) {
        this.winner = players[0];
        this.renderStatus();
    
        confetti.speed = 10;
        confetti.start();
        
        setTimeout(() => this.$winner.classList.add('visible'), 100);
        setTimeout(() => this.$winner.classList.remove('visible'), 2000);
        setTimeout(() => confetti.stop(), 2000);
      } else {
        this.tie = true;
        this.renderStatus();
      }
    } else {
      if( nextPlayer ) {
        this.player = (this.player === this.players.length - 1)
          ? 0
          : this.player + 1;
      }
        
      this.renderStatus();
    }
  }
  
  renderStatus() {
    const player = this.players[this.player];
    
    if( this.winner ) {
      this.setStatus(`<span style="color: ${this.winner.color};">${this.winner.name}</span> has won!`);
    } else if( this.tie ) {
      this.setStatus(`It's a tie!`);      
    } else if( this.playerId === this.player ) {
      this.setStatus(`It's your turn, <span style="color: ${player.color};">${player.name}</span>!`); 
    } else {
      this.setStatus(`It's <span style="color: ${player.color};">${player.name}'s</span> turn!`);         
    }
    
    this.$el.classList.toggle('enabled', this.playerId === this.player);
  }
  
  setStatus(status) {
    this.$status.innerHTML = status;    
  }
  
  setState({ player, players, turns }) {
    this.players = players;
    
    turns.forEach(({ direction, x, y, playerId }) => {
      const line = this.lines[direction][x][y];
      line.setPlayer(playerId);
    });
        
    this.renderStatus();
  }
  
  setPlayerId(playerId) {
    this.playerId = playerId;
  }
  
}

class Lobby {
  
  constructor($el, {
    onStart,
  }) {
    this.$el = $el;
    this.$subtitle = this.$el.querySelector('.subtitle');
    this.$players = this.$el.querySelector('#lobby-players');
    this.$start = this.$el.querySelector('#lobby-start');
    this.$start.addEventListener('click', e => {
      if( this.$start.classList.contains('disabled') ) return;
      onStart();
    });
  }
  
  setState({ players }) {
    this.$players.innerHTML = '';
    players.forEach((player, i) => {
      const $player = document.createElement('li');
      $player.textContent = player.name;
      $player.style.color = player.color;
      $player.classList.toggle('you', this.playerId === i);
      this.$players.appendChild($player);
    });
    
    this.$start.classList.toggle('disabled', players.length < 2);
  }
  
  setSessionId(sessionId) {
    this.$subtitle.textContent = `Invite your friends! http://foo.bar/${sessionId}`;
  }
  
  setPlayerId(playerId) {
    this.playerId = playerId;
  }
  
}

window.addEventListener('load', () => {
  const socket = io();
  const game = new Game(document.getElementById('game'), {
    onTurn: (...props) => {
      socket.emit('turn', ...props, err => {
        if( err ) return alert(err);        
      });
    }
  });
  const lobby = new Lobby(document.getElementById('lobby'), {
    onStart: () => {
      socket.emit('start', err => {
        if( err ) return alert(err);
      });
    },
  });
  
  socket.on('state', state => {
    lobby.setState(state);
    game.setState(state);
    
    document.querySelector('#lobby').classList.toggle('visible', !state.started);
    document.querySelector('#game').classList.toggle('visible', state.started);
  });
  
  let sessionId = window.location.pathname;
  if( sessionId.startsWith('/') ) sessionId = sessionId.substr(1);
  if( sessionId.length === 5 ) {
    socket.emit('joinSession', { sessionId }, (err, result) => {
      if( err ) {
        if( err === 'session_not_found' ) {
          alert('This game doesn\'t exist anymore!');
          return window.location.href = '/';
        }
        
        if( err === 'game_already_started' ) {
          alert('This game has already started!');
          return window.location.href = '/';
        }
          
        if( err === 'max_players' ) {
          alert('Maximum number of players reached!');
          return window.location.href = '/';  
        }
          
        return alert(err);
      }
      
      const { sessionId, playerId, state } = result;
      
      lobby.setSessionId(sessionId);
      lobby.setPlayerId(playerId);
      lobby.setState(state);
      game.setPlayerId(playerId);
      game.setState(state);
    });
  } else {
    socket.emit('createSession', (err, result) => {
      if( err ) return alert(err);
      
      const { sessionId, playerId, state } = result;
      
      history.pushState({ sessionId }, undefined, `/${sessionId}`);
      
      lobby.setSessionId(sessionId);
      lobby.setPlayerId(playerId);
      lobby.setState(state);
      game.setPlayerId(playerId);
      game.setState(state);
    });
  }
});









