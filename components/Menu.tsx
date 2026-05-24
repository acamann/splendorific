import React, { useState } from "react";
import dynamic from "next/dynamic";
import styles from "./Menu.module.scss";

const Modal = dynamic(() => import("./Modal"), { ssr: false });

type Room = {
  name: string;
  players: string[];
};

type GameConfiguration =
  | {
      type: "multiplayer";
      room: Room;
    }
  | {
      type: "tabletop";
      players: {
        name: string;
        aiExperience?: number;
      }[];
    };

interface Props {
  isOpen: boolean;
  close: () => void;
  newGame: (config: GameConfiguration) => void;
  multiplayerRooms: Room[];
  createRoom: (name: string) => void;
}

const Menu = ({
  isOpen,
  close,
  newGame,
  multiplayerRooms,
  createRoom,
}: Props) => {
  const [players, setPlayers] = useState<
    { name: string; aiExperience?: number }[]
  >([{ name: "Player 1" }, { name: "Player 2", aiExperience: 0.5 }]);

  const [selfName, setSelfName] = useState<string>("");
  const [selectedRoom, setSelectedRoom] = useState<string>();
  const [newRoomName, setNewRoomName] = useState<string>("");

  const onChangeName = (playerIndex: number, name: string) => {
    setPlayers((previous) =>
      previous.map((p, i) => (i === playerIndex ? { ...p, name } : p))
    );
  };

  const onChangeAiExperience = (playerIndex: number, aiExperience?: number) => {
    setPlayers((previous) =>
      previous.map((p, i) => (i === playerIndex ? { ...p, aiExperience } : p))
    );
  };

  const addPlayer = (): void => {
    const playerNumber = players.length + 1;
    setPlayers((previous) => [
      ...previous,
      { name: `Player ${playerNumber}`, aiExperience: 0.5 },
    ]);
  };

  const removePlayer = (index: number): void => {
    setPlayers((previous) => {
      const newPlayers = [...previous];
      newPlayers.splice(index, 1);
      return newPlayers;
    });
  };

  return (
    <Modal title="Splendorific" isShowing={isOpen} hide={close}>
      <div className={styles.menu}>
        <div>Welcome! Join a multiplayer game.</div>
        <input value={selfName} onChange={(e) => setSelfName(e.target.value)} />
        {multiplayerRooms.map((room, index) => (
          <div key={index} className={styles.player}>
            <h3>{room.name}</h3>
            <div>{room.players.join(", ")}</div>
            {selectedRoom === undefined ? (
              <button onClick={(): void => setSelectedRoom(room.name)}>
                Join
              </button>
            ) : selectedRoom === room.name ? (
              <button onClick={(): void => setSelectedRoom(undefined)}>
                Leave
              </button>
            ) : null}
          </div>
        ))}
        <input
          value={newRoomName}
          onChange={(e) => setNewRoomName(e.target.value)}
        />
        <button onClick={(): void => createRoom(newRoomName)}>
          Create New Room
        </button>
        <div>Welcome! Configure your game.</div>
        {players.map((player, index) => (
          <div key={index} className={styles.player}>
            <h3>Player {index + 1}</h3>
            <div className={styles.name}>
              <input
                value={player.name}
                onChange={(e) => onChangeName(index, e.target.value)}
              />
              {index > 1 ? (
                <button onClick={() => removePlayer(index)}>X</button>
              ) : undefined}
            </div>
            <label>
              <input
                type="checkbox"
                checked={player.aiExperience !== undefined}
                onChange={(e) =>
                  onChangeAiExperience(
                    index,
                    e.currentTarget.checked ? 0.5 : undefined
                  )
                }
              />
              Computer
            </label>
            {player.aiExperience ? (
              <label>
                Naive
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={player.aiExperience}
                  onChange={(e) =>
                    onChangeAiExperience(
                      index,
                      e.currentTarget.value as unknown as number
                    )
                  }
                />
                Experienced
              </label>
            ) : undefined}
          </div>
        ))}
        {players.length < 4 ? (
          <button onClick={addPlayer}>Add Player</button>
        ) : undefined}

        <button
          onClick={() => {
            const room = multiplayerRooms.find(
              (room) => room.name === selectedRoom
            );
            if (room) {
              newGame({
                type: "multiplayer",
                room,
              });
              close();
            }
          }}
        >
          Start Game
        </button>
      </div>
    </Modal>
  );
};

export default Menu;
