# web socket communication

 - client to server: turn (ex. purchase card)
 - server determines if valid (are you the current player?  do you have enough stuff?)
 - (optional) server to client: need to do more (ex. select which chip to return to bank, or that was invalid)
 - server to all clients:
  - list of transactions: player A purchased card X with chips x,y,z (this triggers animation for each client)
  - new game state (including next player index)