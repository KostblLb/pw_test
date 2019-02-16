import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as $ from 'jquery';
import { BrowserRouter as Router, Route, Link } from 'react-router-dom';

import { Feed, LoadedFeedArticles } from './components/feed';
import { Article } from './article';

//gets gaming news from https://www.rockpapershotgun.com/
const getRPSArticles = (pageNum: number, favoriteIds: string[] = null): Promise<LoadedFeedArticles> => {
    return new Promise((resolve, reject) => {
        $.ajax(`/posts?context=embed&page=${pageNum}${favoriteIds ? `&include=${favoriteIds.join(',')}` : ''}`, {
                headers: {
                    "Access-Control-Allow-Origin": "*",
                },
                contentType: 'application/json',
            })
            .then((responseJson: any[]) => {
                // rps api returns entries sorted by date
                resolve({
                    articles: responseJson.map((entry: any): Article => ({
                        id: entry.id,
                        date: new Date(entry.date),
                        title: entry.title.rendered,
                        link: entry.link,
                        excerpt: entry.excerpt.rendered,
                    })),
                    lastPage: false,
                })
            })
            .fail((error: any) => {
                if (error.responseJSON && error.responseJSON.code === 'rest_post_invalid_page_number') {
                    resolve({
                        articles: [],
                        lastPage: true,
                    });
                }
                else reject(error.responseJSON ? error.responseJSON.message : error.responseText);
            });
    });
}

const RPSFeed = (favsOnly: boolean = false) => () => <Feed getArticles={getRPSArticles} favoritesOnly={favsOnly} />
export const RoutedFeed = () => (
    <Router>
        <div>
            <div style={{marginBottom: "5px"}}>
                <Link to='/'>All</Link>
                <Link to='/favorites'> | Favorites</Link>
            </div>
            <Route path='/' exact={true} component={() => <Feed getArticles={getRPSArticles} favoritesOnly={false}/>} />
            <Route path='/favorites' component={() => <Feed getArticles={getRPSArticles} favoritesOnly={true} />} />
        </div>
    </Router>
)


ReactDOM.render(<RoutedFeed />, document.getElementById('root'));