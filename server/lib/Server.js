'use strict';

const path = require('path');
const http = require('http');
const debug = require('debug')('Server');
const express = require('express');
const io = require('socket.io');

const Util = require('./Util');

const {
  PORT,
  PLAYERS,
} = require('../../config');

module.exports = class Server {
  
  constructor() {
    this.app = express();
    this.app.use(express.static(path.join(__dirname, '..', '..', 'public')));
    this.app.get('/:sessionId([A-Za-z0-9]{5})', (req, res) => {
      res.sendFile(path.join(__dirname, '..', '..', 'public', 'index.html'));
    });
    
    this.server = http.createServer(this.app);
    this.server.listen(PORT, () => {
      debug(`Listening on http://0.0.0.0:${PORT}`);
    });
    
    this.io = io(this.server);
    this.io.on('connection', this.onIOConnection.bind(this));
    
    this.sessions = {};
  }
  
  onIOConnection(socket) {
    debug('onIOConnection', socket.id);
    
    socket.on('createSession', this.onIOCreateSession.bind(this, socket));
    socket.on('joinSession', this.onIOJoinSession.bind(this, socket));
    socket.on('start', this.onIOStart.bind(this, socket));
    socket.on('turn', this.onIOTurn.bind(this, socket));
  }
  
  onIOCreateSession(socket, callback) {
    debug('onIOCreateSession');
    
    const sessionId = Util.createSessionId();
    this.sessions[sessionId] = {
      sessionId,
      started: false,
      player: 0,
      players: [
        {
          ...PLAYERS[0],
        }
      ],
      turns: [],
    };
    socket.playerId = 0;
    socket.sessionId = sessionId;
    socket.session = this.sessions[sessionId];
    socket.join(sessionId);
    this.io.to(sessionId).emit('state', socket.session);
    
    callback(null, {
      sessionId: socket.sessionId,
      playerId: socket.playerId,
      state: socket.session,
    });
  }
  
  onIOJoinSession(socket, { sessionId }, callback) {
    debug('onIOJoinSession');
    
    socket.sessionId = sessionId;
    socket.session = this.sessions[sessionId];
    
    if( !socket.session )
      return callback('session_not_found');
      
    if( socket.session.players.length === PLAYERS.length )
      return callback('max_players');
      
    if( socket.session.started )
      return callback('game_already_started');
      
    socket.session.players.push({
      ...PLAYERS[socket.session.players.length],
    });
    socket.playerId = socket.session.players.length - 1;
    
    socket.join(sessionId);
    this.io.to(sessionId).emit('state', socket.session);
    
    callback(null, {
      sessionId: socket.sessionId,
      playerId: socket.playerId,
      state: socket.session,
    });
  }
  
  onIOStart({ session, sessionId }, callback) {
    if( !session )
      return callback('session_not_found');
    
    if( session.players.length < 2 )
      return callback('Waiting for players...');
      
    session.started = true;
    
    this.io.to(sessionId).emit('state', session);
    
    callback();
  }
  
  onIOTurn({ session, playerId, sessionId }, { direction, x, y }, callback) {
    if( !session )
      return callback('session_not_found');
      
    if( !session.started )
      return callback('Game not started!');
      
/*
    if( session.player !== playerId )
      return callback('Not your turn!');
*/
        
    session.turns.push({ playerId, direction, x, y });
    session.player = session.player + 1;
    if( session.player > (session.players.length - 1)) session.player = 0;    
    
    this.io.to(sessionId).emit('state', session);
      
    callback();
  }
    
}