import {useState, useEffect, useRef} from 'react';
import socket from '../../socket';
import ACTIONS from '../../socket/actions';
import { useNavigate } from 'react-router-dom'; // Импорт useNavigate
import {v4} from 'uuid';

export default function Main() {
  const navigate = useNavigate(); // Получение функции navigate
  const [rooms, updateRooms] = useState([]);
  const rootNode = useRef();

  useEffect(() => {
    socket.on(ACTIONS.SHARE_ROOMS, ({rooms = []} = {}) => {
      if (rootNode.current) {
        updateRooms(rooms);
      }
    });
  }, []);

  return (
    <div className='join_room' ref={rootNode}>
      <h1>Созданные комнаты:</h1>

      <ul>
        {rooms.map(roomID => (
          <li className='join' key={roomID}>
            {roomID}
            <button className='button_room join' onClick={() => {
							const join = {
								method: "Join",
								room: {roomID}
							};
							socket.emit("message", join);
              navigate(`/room/${roomID}`); // Использование navigate
            }}>Присоединиться к комнате</button>
          </li>
        ))}
      </ul>

      <button className='button_room create' onClick={() => {
			let ID = v4();
			const create = {
				method: "Create",
				room: ID
			};
			socket.emit("message", create);
        navigate(`/room/${ID}`); // Использование navigate
      }}>Создать новую комнату</button>
    </div>
  );
}
