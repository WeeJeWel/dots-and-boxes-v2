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
      this.player.score++;
      
      this.$scribblePolyline.style.strokeWidth = 75 + Math.random() * 50;
      this.$scribblePolyline.style.stroke = this.player.color;
      this.$scribble.classList.add('visible');
    }
    
  }
  
}

class Line {
  
  constructor(game, { x, y }) {
    this.game = game;
    this.x = x;
    this.y = y;
    
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
  
  onClick() {
    if( this.player ) return;
    this.player = this.game.players[this.game.player];
    this.listeners.forEach(listener => listener({
      player: this.player,
    }));
    
    this.$line.classList.add('taken');
    this.$line.style.stroke = this.player.color;
    this.$line.style.stroke = 'white';
    this.game.nextTurn();
  }
  
}

class LineHorizontal extends Line {
  
}

class LineVertical extends Line {
  
}

class Player {
  
  constructor({ name, color }) {
    this.name = name;
    this.color = color;
    
    this.score = 0;
  }
  
}

class Game {
  
  constructor($el, {
    width = 3,
    height = 3,
    players = [
      new Player({
        name: 'Player One',
        color: '#CCCC00',
      }),
      new Player({
        name: 'Player Two',
        color: '#00CCCC',
      }),
      new Player({
        name: 'Player Three',
        color: '#CC00CC',
      }),
    ],
  } = {}) {
    this.$el = $el;
    this.$svg = this.$el.querySelector('svg');
    this.$status = this.$el.querySelector('#status');
    this.$winner = this.$el.querySelector('#winner');
    
    this.width = width;
    this.height = height;
    this.players = players;
    this.player = -1;
    
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
        this.lines['h'][y] = this.lines['h'][y] || [];
        const lineTop = this.lines['h'][y][x] = this.lines['h'][y][x] || new LineHorizontal(this, {
          x,
          y,
        });
        
        this.lines['h'][y + 1] = this.lines['h'][y + 1] || [];
        const lineBottom = this.lines['h'][y + 1][x] = this.lines['h'][y + 1][x] || new LineHorizontal(this, {
          x,
          y: y + 1,
        });
        
        this.lines['v'][x] = this.lines['v'][x] || [];
        const lineLeft = this.lines['v'][x][y] = this.lines['v'][x][y] || new LineVertical(this, {
          x,
          y,
        });
        
        this.lines['v'][x + 1] = this.lines['v'][x + 1] || [];
        const lineRight = this.lines['v'][x + 1][y] = this.lines['v'][x + 1][y] || new LineVertical(this, {
          x: x + 1,
          y,
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
    
    this.nextTurn();
  }
  
  nextTurn() {
    let allBoxesTaken = true;
    this.boxes.forEach(row => {
      row.forEach(box => {
        if( !box.player ) {
          allBoxesTaken = false;
        }
      });
    });
    
    if( allBoxesTaken ) {
      const players = this.players.sort((a, b) => b.score - a.score);
      if( players[0].score > players[1].score ) {
        this.setStatus(`${players[0].name} has won!`);
        this.setStatusColor(players[0].color);   
    
        confetti.speed = 10;
        confetti.start();
        
        setTimeout(() => this.$winner.classList.add('visible'), 100);
        setTimeout(() => this.$winner.classList.remove('visible'), 2000);
        setTimeout(() => confetti.stop(), 2000);
      } else {
        this.setStatus(`It's a tie!`);        
      }
    } else {
      this.player = (this.player === this.players.length - 1)
        ? 0
        : this.player + 1;
      this.setStatus(`It's your turn, ${this.players[this.player].name}!`); 
      this.setStatusColor(this.players[this.player].color);     
    }
  }
  
  setStatus(status) {
    this.$status.textContent = status;    
  }
  
  setStatusColor(color = 'blue') {
//    this.$status.style.color = color;
  }
  
}

window.addEventListener('load', () => {
  const game = new Game(document.getElementById('game'), {});
});