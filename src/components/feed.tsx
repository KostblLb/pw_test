import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { Article } from '../article';
import './feed.css';

export interface LoadedFeedArticles {
    articles: Article[],
    lastPage: boolean,
}

interface FeedProps {
    getArticles: (page: number, favoriteIds: string[]) => Promise<LoadedFeedArticles>,
    favoritesOnly: boolean,
}

interface FeedState {
    articles: Article[],
    lastPage: boolean,
    isLoading: boolean,
    currentPage: number,
    error: string,
    favorites: string[],
}


const FAVORITES_KEY = 'pw-newsfeed-test-favorites';
const getFavorites = (): string[] => {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY)) || [];
}
const setFavorites = (favs: string[]) => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
}

export class Feed extends React.Component<FeedProps, FeedState> {
    loadingTrigger: HTMLElement

    constructor(props) {
        super(props);
        this.state = {
            articles: [],
            lastPage: false,
            isLoading: false,
            currentPage: 0,
            error: null,
            favorites: getFavorites(),
        }
        this.loadingTrigger = null;
        
        this.setLoadingTrigger = this.setLoadingTrigger.bind(this);
        this.tryTriggerPageLoading = this.tryTriggerPageLoading.bind(this);
    }

    setLoadingTrigger(t) {
        this.loadingTrigger = t;
    }
    
    componentDidMount() {
        const { getArticles } = this.props;
        this.loadNextPage();
    }

    componentDidUpdate() {
        this.tryTriggerPageLoading();
    }

    tryTriggerPageLoading() {
        if (this.loadingTrigger) {
            const triggerRect = this.loadingTrigger.getBoundingClientRect();
            if (triggerRect.left < window.innerWidth && triggerRect.right > 0
            && triggerRect.top < window.innerHeight && triggerRect.bottom > 0) {
                this.loadNextPage();
            }
        }
    }

    loadNextPage() {
        const { currentPage, articles, favorites, isLoading, lastPage } = this.state;
        const { getArticles, favoritesOnly } = this.props;
        if (isLoading || lastPage) return;
        if (favoritesOnly && !favorites.length) return;
        this.setState({ isLoading: true });
        getArticles(currentPage + 1, favoritesOnly ? getFavorites() : null)
            .then((newArticles) => this.setState({
                isLoading: false,
                articles: articles.concat(newArticles.articles),
                lastPage: newArticles.lastPage,
                currentPage: currentPage + 1 
            }))
            .catch((error) => this.setState({ isLoading: false, error }));
    }

    toggleFavorite(id) {
        const favs = getFavorites();
        const favIdx = favs.findIndex(fav => fav === id);
        if (favIdx > -1) {
            favs.splice(favIdx, 1);
        }
        else {
            favs.push(id);
        }
        
        setFavorites(favs);
        this.setState({ favorites: favs });
    }

    isFavorite(id) {
        const { favorites } = this.state;
        return !!favorites.find(fav => fav === id);
    }

    makeArticleViews() {
        const { articles } = this.state;
        const filteredArticles = this.props.favoritesOnly ? articles.filter((article) => this.isFavorite(article.id)) : articles;
        return filteredArticles.map((article, i) => {
            const isFavorite = this.isFavorite(article.id);
            const toggleFavorite = () => this.toggleFavorite(article.id);
            return <ArticleView key={i} item={article} isFavorite={isFavorite} toggleFavorite={toggleFavorite} />  
        })
    }

    render() {
        const { articles, isLoading, error } = this.state;
        return (
            <div className="feed-container" onScroll={this.tryTriggerPageLoading}>
                <div className="feed">
                    {this.makeArticleViews()}
                </div>
                {error && <span className="feed-error">{error}</span>}
                {isLoading
                    ? <div className="feed-loader" >l o a d i n g . . .</div>
                    : <div className="feed-loading-trigger-container">
                        <div className="feed-loading-trigger" ref={this.setLoadingTrigger} />
                    </div>
                }
            </div>
        );
    }
}

interface ArticleProps {
    item: Article,
    isFavorite: boolean,
    toggleFavorite: () => void,
}

const makeHtml = (htmlString: string) => ({ __html: htmlString });
class ArticleView extends React.Component<ArticleProps> {
    constructor(props) {
        super(props);
        
        const { item: { id } } = this.props;
        const favs = getFavorites();
        const isFavorite = !!favs.find(fav => fav === id);
        this.state = { isFavorite };
    }

    render() {
        const { item, isFavorite, toggleFavorite } = this.props;
        return(
            <div>
                <div className="article-favorite-toggle" onClick={toggleFavorite} title={isFavorite ? 'Unstar' : 'Star'}>{isFavorite ? '★' : '☆'}</div>
                <a href={item.link} dangerouslySetInnerHTML={makeHtml(item.title)} />
                <p>{item.date.toDateString()}</p>
                <div dangerouslySetInnerHTML={makeHtml(item.excerpt)} />
            </div>
        );
    }
}