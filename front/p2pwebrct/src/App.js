import {BrowserRouter, Routes, Route} from 'react-router-dom';

import Room from './pages/Room';
import Main from './pages/Main';
import NotFound404 from './pages/NotFound404';
import StaticPageRedirect from './pages/StaticPageRedirect';

function App() {
  return (
    <BrowserRouter>
      <Routes>
				<Route exact path='/room/:id' element={<Room/>}/>
        <Route exact path='/lobby' element={<Main/>}/>
        <Route exact path='/' element={<StaticPageRedirect to="/home.html" />} />
        <Route path="*" element={<NotFound404/>}/>
      </Routes>
    </BrowserRouter>
  );
}
export default App;
