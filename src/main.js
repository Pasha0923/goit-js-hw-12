import iziToast from 'izitoast';
import 'izitoast/dist/css/iziToast.min.css';

import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';

import axios from 'axios';
const refs = {
  searchForm: document.querySelector('.search-form'),
  photoList: document.querySelector('.photo-list'),
  loader: document.querySelector('.loader'),
  loaderBottom: document.querySelector('.loader-before-button'),
  loadMoreBtn: document.querySelector('.fetch-more-button'),
};
const hiddenClass = 'is-hidden';
const refreshPage = new SimpleLightbox('.photo-list a', {
  captions: true,
  captionsData: 'alt',
  captionDelay: 250,
});

let page = 1;
let query = '';
let maxPage = 0;

const BAZE_URL = 'https://pixabay.com/api';
const API_KEY = '41870399-9b44301246ceb98c07efd626a';
refs.searchForm.addEventListener('submit', handleSearch); // обробник подій на форму подія submit
// пишемо функцію для того щоб робити запит
// функція,яка описує обробник події  handleSearch
async function handleSearch(event) {
  event.preventDefault(); // скидуємо стандартну поведінку браузера

  refs.photoList.innerHTML = ''; // очищаємо вміст галереї (перед здійсненням нового пошуку вміст
  // галереї очищаємо щоб уникнути переплутання результатів)
  refs.loader.classList.remove(hiddenClass);
  page = 1;
  const form = event.currentTarget;
  query = form.elements.query.value; // дістаємо значення з форми

  // перевірка на пустий рядок запиту

  if (query === '') {
    // refs.loadMoreBtn.disabled = false;
    refs.loadMoreBtn.classList.add(hiddenClass);
    refs.loader.classList.add(hiddenClass);
    iziToast.show({
      message: 'Please enter your request',
      position: 'topRight',
      color: 'yellow',
    });
    return;
  }
  try {
    const { hits, totalHits } = await searchPhoto(query); //посилаємо перший запит на сервер
    console.log(totalHits);
    // рахуємо і записуємо в обʼєкт максимальну кількість сторінок в нашому запиті,  для цього ділимо кількість
    //  результатів на кількість обʼєктів, які ми отримуємо за один запит + округляємо в більшу сторону
    maxPage = Math.ceil(totalHits / 40);
    console.log(maxPage);
    createMarkuPhoto(hits, refs.photoList); // додали нові елементи до списку зображень
    refreshPage.refresh();
    // перевірка на те, чи показувати кнопку при першому запиті (при сабміті форми),
    // якщо кількість обʼєктів відповіді більша за нуль та кількість обʼєктів відповіді не рівна
    // загальної кількості результатів, то показуємо кнопку.Інакше - не показуємо
    if (hits.length > 0 && hits.length !== totalHits) {
      refs.loadMoreBtn.classList.remove(hiddenClass);
      refs.loadMoreBtn.addEventListener('click', handleButton);
    } else {
      refs.loadMoreBtn.classList.add(hiddenClass);
    }
  } catch (error) {
    console.log(error.message);
  } finally {
    refs.loader.classList.add(hiddenClass);
    form.reset();
  }
}

async function searchPhoto(value, page = 1) {
  const resp = await axios.get(
    `${BAZE_URL}/?key=${API_KEY}&q=${value}&image_type=photo&orientation=horizontal&safesearch=true&per_page=40&page=${page}`
  );

  // витягуємо масив об'єктів
  //   console.log(resp);
  return resp.data;
}

// обробник подій на кнопку LOAD MORE

async function handleButton() {
  // перед тим як робимо запит на сервер робимо спочатку відключення кнопки
  refs.loadMoreBtn.disabled = true;

  page += 1;

  //перед початком запиту loader показуємо ( для цього прибираємо схований клас який на loader "is-hidden по замовчуванню")
  refs.loaderBottom.classList.remove(hiddenClass);

  try {
    const { hits } = await searchPhoto(query, page);
    createMarkuPhoto(hits, refs.photoList);
  } catch (error) {
    console.log(error);
  } finally {
    //розблоковуємо кнопку в кінці коли запит завершиться , loader ховаємо
    refs.loaderBottom.classList.add(hiddenClass);
    refs.loadMoreBtn.disabled = false;

    //і обовʼязково після натискання на кнопку та закінчення запиту робимо перевірку що :
    //якщо ми зараз знаходимось на останній сторінці - то ховаємо кнопку і видаляємо обробник подій!
    // ПЕРЕВІРКА якщо поточна сторінка = максимальній , то ховаємо кнопку
    if (page === maxPage) {
      refs.loadMoreBtn.classList.add(hiddenClass);
      refs.loadMoreBtn.removeEventListener('click', handleButton);
      iziToast.show({
        title: '❌',
        messageColor: 'white',
        message: "We're sorry, but you've reached the end of search results.",
        position: 'bottomCenter',
        color: 'red',
      });
    }
  }
}

function createMarkuPhoto(data) {
  const markup = data
    .map(
      hits => `<li class="gallery-item">
<a class="gallery-link" href="${hits.largeImageURL}">
<img class="gallery-image" ;
    src="${hits.webformatURL}"
    data-source="${hits.largeImageURL}"
   alt="${hits.tags}" />
   </a>
    <p>Likes: ${hits.likes}</p>
   <p>Views: ${hits.views}</p>
   <p>Comment: ${hits.comments}</p>
   <p>Downloads: ${hits.downloads}</p>
</li>`
    )
    .join('');
  // додаємо нові елементи до галереї
  refs.photoList.innerHTML = markup;
}
