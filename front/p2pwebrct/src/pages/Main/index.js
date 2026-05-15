import {useState, useEffect, useRef} from 'react';
import socket from '../../socket';
import ACTIONS from '../../socket/actions';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {v4} from 'uuid';
import { openPlayerProfileModal, hidePlayerProfileModal } from '../../playerProfileModal.js';
import { rememberRoomTitleForClient, getStoredRoomTitleForList, ROOM_TITLE_QUERY } from '../../roomTitleBridge.js';
import { readTabProfile } from '../../profileSession.js';

function normalizeRoomList(raw) {
	if (!Array.isArray(raw)) {
		return [];
	}
	return raw.map((entry) => {
		if (entry && typeof entry === 'object' && entry.id) {
			const id = String(entry.id);
			const fromClient = getStoredRoomTitleForList(id);
			const fromServer = String(entry.name || '').trim();
			const candidates = [fromClient, fromServer].map((s) => String(s || '').trim()).filter(Boolean);
			const name = candidates.find((x) => x !== 'Комната') || candidates[0] || 'Комната';
			return { id, name, players: Number(entry.players) || 0 };
		}
		if (typeof entry === 'string') {
			const id = entry;
			const fromClient = getStoredRoomTitleForList(id);
			return { id, name: fromClient || 'Комната', players: 0 };
		}
		return null;
	}).filter(Boolean);
}

function sanitizeRoomTitleInput(raw) {
	let s = String(raw || '').trim().replace(/[\u0000-\u001F\u007F]/g, '');
	if (!s) return 'Комната';
	if (s.length > 48) s = s.slice(0, 48);
	return s;
}

function hasCompleteLocalProfile() {
	const { name, gender } = readTabProfile('global');
	const g = String(gender || '').trim();
	return Boolean(name) && (g === 'Male' || g === 'Female');
}

export default function Main() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [rooms, updateRooms] = useState([]);
  const rootNode = useRef();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newRoomTitle, setNewRoomTitle] = useState('');

  useEffect(() => {
    if (searchParams.get('create') === '1') {
      setCreateModalOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    const handler = ({rooms: raw = []} = {}) => {
      if (rootNode.current) {
        updateRooms(normalizeRoomList(raw));
      }
    };
    socket.on(ACTIONS.SHARE_ROOMS, handler);
    return () => {
      socket.off(ACTIONS.SHARE_ROOMS, handler);
      hidePlayerProfileModal();
    };
  }, []);

  const finalizeCreateRoom = (roomId, displayName) => {
    rememberRoomTitleForClient(roomId, displayName);
    socket.emit('message', {
      method: 'Create',
      room: roomId,
      roomName: displayName,
    });
    const q = `${ROOM_TITLE_QUERY}=${encodeURIComponent(displayName)}`;
    navigate(`/room/${roomId}?${q}`);
    setCreateModalOpen(false);
    setNewRoomTitle('');
  };

  const runCreateRoomFlow = () => {
    const displayName = sanitizeRoomTitleInput(newRoomTitle);
    const roomId = v4();
    const go = () => finalizeCreateRoom(roomId, displayName);
    if (hasCompleteLocalProfile()) {
      go();
      return;
    }
    openPlayerProfileModal({
      onApply: go,
      storageScopeId: 'global',
    });
  };

  return (
    <div className='join_room' ref={rootNode}>
      <p className="join_room-back">
        <a href="/start_of_play.html">← Назад</a>
      </p>
      <h1>Созданные комнаты:</h1>

      <ul className="join_room-list">
        {rooms.map((room) => (
          <li className='join' key={room.id}>
            <span className="join_room-name">{room.name}</span>
            <span className="join_room-meta">Игроков: {room.players}</span>
            <button className='button_room join' type="button" onClick={() => {
							const join = {
								method: "Join",
								room: { roomID: room.id }
							};
							socket.emit("message", join);
              navigate(`/room/${room.id}`);
            }}>Присоединиться к комнате</button>
          </li>
        ))}
      </ul>

      <button className='button_room create' type="button" onClick={() => setCreateModalOpen(true)}>Создать новую комнату</button>

      {createModalOpen ? (
        <div className="create-room-overlay" role="dialog" aria-modal="true" aria-labelledby="create-room-title">
          <div className="create-room-dialog">
            <h2 id="create-room-title" className="create-room-heading">Новая комната</h2>
            <label className="create-room-label" htmlFor="create-room-name-input">Название</label>
            <input
              id="create-room-name-input"
              className="create-room-input"
              type="text"
              maxLength={48}
              placeholder="Например, Вечерний манчкин"
              value={newRoomTitle}
              onChange={(e) => setNewRoomTitle(e.target.value)}
              autoFocus
            />
            <div className="create-room-actions">
              <button type="button" className="create-room-btn create-room-btn--ghost" onClick={() => {
                setCreateModalOpen(false);
                setNewRoomTitle('');
              }}>Отмена</button>
              <button type="button" className="create-room-btn create-room-btn--primary" onClick={runCreateRoomFlow}>Создать</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
