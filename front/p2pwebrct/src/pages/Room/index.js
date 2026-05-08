import {useParams} from 'react-router';
import useWebRTC, {LOCAL_AUDIO} from '../../hooks/useWebRTC';
import "../../card-block";
import "../../увеличение карточек во время игры.js";


export default function Room() {
  const {id: roomID} = useParams();
  const {clients, provideMediaRef} = useWebRTC(roomID);

  return (
    <div>
      {clients.map((clientID, index) => {
        return (
          <div key={clientID} id={clientID}>
            <audio
              ref={instance => {
                provideMediaRef(clientID, instance);
              }}
              autoPlay
              muted={clientID === LOCAL_AUDIO}
            />
          </div>
        );
      })}
			<div>
				<main className="main">
					<section className="area">
						<div className="container">
							
							<div className="myhand cards-zone" id="myhand">
							</div>

							<div className="opponenthand cards-zone" id="opponenthand">
							</div>

							<div className="zone_opponent cards-zone" id="zone_opponent">
							</div>

							<div className="zone_opponent_side cards-zone" id="zone_opponent_side">
							</div>
							
							<div className="opponent2hand cards-zone" id="opponent2hand">
							</div>

							<div className="zone_opponent2 cards-zone" id="zone_opponent2">
							</div>

							<div className="zone_opponent2_side cards-zone" id="zone_opponent2_side">
							</div>

							<div className="opponent3hand cards-zone" id="opponent3hand">
							</div>

							<div className="zone_opponent3 cards-zone" id="zone_opponent3">
							</div>

							<div className="zone_opponent3_side cards-zone" id="zone_opponent3_side">
							</div>

							<div className="zone2 cards-zone" id="zone2">
							</div>
							
							<div className="zone3 cards-zone" id="zone3">
								<span id="MyBonus" className="MyBonus">0</span>
							</div>

							<div className="zone_monster cards-zone" id="zone_monster">
								<span id="MonsterBonus" className="MonsterBonus">0</span>

							</div>

							<div className="zone5 cards-zone" id="zone5">
							</div>

							<div className="zone_doors cards-zone" id="zone_doors">
							</div>

							<div className="zone_treasure cards-zone" id="zone_treasure">
							</div>

							<div className="zone_doors_drop cards-zone" id="zone_doors_drop">
								<div className = "zone_drop"> зона сброса 
								</div>
								<div className="card" id = "card" draggable="true">
								</div>
							</div>

							<div className="zone_treasure_drop cards-zone" id="zone_treasure_drop">
								<div className = "zone_drop" > зона сброса
								</div>
								<div className="card" id = "card"draggable="true">
								</div>
							</div>

							<div className="button_start_game">
								<button>Начать игру</button>
							</div>
							<div className="battle-result" id="battle-result"></div>
							<div className="timer" id="timer"></div>
							<div className="fold" id="fold">Пас</div>
							<div className="fold" id="end-turn">Завершить ход</div>
							<div className="abilities-panel" id="abilities-panel">
								<div className="fold" id="warrior-frenzy-btn">Буйство</div>
								<div className="fold" id="cleric-exorcism-btn">Изгнание</div>
								<div className="fold" id="wizard-taming-btn">Заклинание<br />Усмирения</div>
								<div className="fold" id="thief-theft-btn">Кража</div>
								<div className="fold" id="thief-trim-btn">Подрезка</div>
							</div>
							<div className="fold" id="offer-help">Предложить помощь</div>

							<div className="settings_in_game_board">
								<a href="../menu_settings.html" className="settings__logo-link">
									<img src="../img/svg/settings.svg" width="115px" height="115px"alt="Настройки" className="settings__logo-pic"/>
								</a>
							</div>

							<div className="chat_in_game_board">
								<a href="#!" className="settings__logo-link">
									<img src="../img/svg/pngegg (2) 1.svg" width="115px" height="115px"alt="Настройки" className="settings__logo-pic"/>
								</a>
							</div>
							<div className="history_in_game_board">
								<a href="#!" className="settings__logo-link">
									<img src="../img/svg/kisspng-computer-icons-icon-design-clip-art-lead-5b4a618c4d22d2 1.svg" width="115px" height="115px"alt="Настройки" className="settings__logo-pic"/>
								</a>
							</div>
							<button id="next-button" ><img src="../img/svg/стрела 1.svg" /> </button>
							<button id="prev-button" ><img src="../img/svg/стрела 2.svg" /> </button>
						</div>
					</section>
					<div className="container2">
						<div className="image-container">
							<img src="../img/svg/лого 8.svg" alt="Image 1" className="image-top-left"/>
							<span className="level-top-left">1</span>
						</div>
						<div className="image-container">
							<img src="../img/svg/лого 8.svg" alt="Image 1" className="image-bottom-left"/>
							<span className="level-bottom-left">1</span>
						</div>
						<div className="image-container">
							<img src="../img/svg/лого 9.svg" alt="Image 2" className="image-top-right"/>
							<span className="level-top-right">1</span>
						</div>
						<div className="image-container">
							<img src="../img/svg/лого 9.svg" alt="Image 2" className="image-bottom-right"/>
							<span className="level-bottom-right">1</span>
						</div>
						<div className="image-container">
							<img src="../img/svg/лого 8.svg" alt="Image 1" className="image-bottom-center"/>
							<span className="level-bottom-center">1</span>
						</div>
						<div className="image-container">
							<img src="../img/svg/лого 9.svg" alt="Image 2" className="top-center-image"/>
							<span className="level-top-center">1</span>
						</div>

						<div className="top-left">
							<span id="PowerPlayer4" className="PowerPlayer4">0</span>
							<img  src="../img/svg/sword_icon-icons 2.svg" alt="картинка"/>
						</div>
						<div className="top-right">
							<span id="PowerPlayer3" className="PowerPlayer3">0</span>
							<img  src="../img/svg/sword_icon-icons 2.svg" alt="картинка"/>
						</div>
						<div className="bottom-left">
							<span id="PowerPlayer5" className="PowerPlayer5">0</span>
							<img  src="../img/svg/sword_icon-icons 2.svg" alt="картинка"/>
						</div>
						<div className="bottom-right">
							<span id="PowerPlayer6" className="PowerPlayer6">0</span>
							<img  src="../img/svg/sword_icon-icons 2.svg" alt="картинка"/>
						</div>
						<div className="bottom-center">
							<img src="../img/money-bag.png" alt="" className="MoneyBag"/>
							<span id="MyPower" className="MyPower">0</span>
							<img  src="../img/svg/sword_icon-icons 2.svg" alt="картинка"/>
						</div>
						<div className="top-center">
							<span id="PowerPlayer2" className="PowerPlayer2">0</span>
							<img  src="../img/svg/sword_icon-icons 2.svg" alt="картинка"/>
						</div>

						<div class="dice-container"></div>
					</div>
				</main>
			</div>
    </div>
  );
}