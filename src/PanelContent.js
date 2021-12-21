import React from "react";
import './PanelContent.css'
import axios from './api'
import Cookies from 'universal-cookie'

const cookies = new Cookies();

export default class PanelContent extends React.Component {
    constructor(props) {
        super(props);
        const checked = []
        this.state = {
            questions: [],
            currentIndex: 0,
            currentScore: 0,
            checked: checked,
            isChecked: false,
            isRight: false,
            isCurrentRight: false,
            loading: true,
            currentInputAnswer: ''
        }
    }

    handleChange = (event) => {
        const question = this.state.questions[this.state.currentIndex];
        if (question.type === 'radio') {
            const {checked} = this.state
            for (let i = 0; i < checked.length; i++) {
                checked[i] = false;
            }
            checked[event.target.name] = true
            this.setState({
                checked: checked
            })
        } else if (question.type === 'checkbox') {
            const {checked} = this.state
            checked[event.target.name] = event.target.checked
            this.setState({
                checked: checked
            })
        } else if (question.type === 'input') {
            this.setState({
                currentInputAnswer: event.target.value
            })
        }
    }

    nextClick = () => {
        const savedState = {}
        const questionsIds = this.state.questions.map(x => x.id)
        const currentIndex = this.state.currentIndex;

        let isRight = true;
        let currentScore = this.state.currentScore;

        if (this.state.isChecked) isRight = this.state.isRight;
        else {
            if (this.state.questions[this.state.currentIndex].type !== 'input') {
                for (let i = 0; i < this.state.checked.length; i++) {
                    isRight = isRight && (this.state.checked[i] === this.state
                        .questions[this.state.currentIndex].answers[i].right)
                }
            } else {
                const userAnswer = this.state.currentInputAnswer.toLowerCase().trim();
                const correctAnswer = this.state.questions[this.state.currentIndex].answers[0].text.toLowerCase().trim()
                isRight = (userAnswer === correctAnswer)
            }
        }
        if (isRight || this.state.questions[this.state.currentIndex].type === 'text') currentScore++;

        savedState['questions'] = questionsIds;
        savedState['currentScore'] = currentScore;
        savedState['currentIndex'] = currentIndex + 1;
        cookies.set(this.props.currentItem.id, JSON.stringify(savedState), {maxAge: 60 * 60 * 24 * 2})

        const checked = []
        if (this.state.currentIndex + 1 < this.state.questions.length)
            this.state.questions[this.state.currentIndex + 1].answers.forEach(() => checked.push(false))
        this.setState({
            currentIndex: this.state.currentIndex + 1,
            checked: checked,
            isChecked: false,
            isRight: false,
            isCurrentRight: false,
            currentScore: currentScore,
            currentInputAnswer: ''
        })

    }

    newClick = () => {
        const checked = []
        cookies.remove(this.props.currentItem.id)
        this.state.questions[0].answers.forEach(() => checked.push(false))
        this.setState({
            currentIndex: 0,
            checked: checked,
            isChecked: false,
            isRight: false,
            isCurrentRight: false,
            currentScore: 0,
            currentInputAnswer: ''
        })
    }

    checkClick = () => {
        let isRight = true
        if (this.state.questions[this.state.currentIndex].type !== 'input') {
            for (let i = 0; i < this.state.checked.length; i++) {
                isRight = isRight && (this.state.checked[i] === this.state
                    .questions[this.state.currentIndex].answers[i].right)
            }
        } else {
            const userAnswer = this.state.currentInputAnswer.toLowerCase().trim();
            const correctAnswer = this.state.questions[this.state.currentIndex].answers[0].text.toLowerCase().trim()
            isRight = (userAnswer === correctAnswer)
        }
        const isFirstCheckRight = this.state.isChecked ? this.state.isRight : isRight;
        this.setState({
            isChecked: true,
            isRight: isFirstCheckRight,
            isCurrentRight: isRight
        })
    }

    loadQuestions = () => {
        axios.get('/api/questions/?format=json', {
            headers: {
                topic: this.props.currentItem.id
            }
        })
            .then(data => {
                const questions = data.data;
                let savedState = cookies.get(this.props.currentItem.id, {doNotParse: true});
                const checked = [];
                if (savedState) {
                    savedState = JSON.parse(savedState)
                    const sortedQuestions = []
                    let currentIndex = savedState.currentIndex;
                    savedState.questions.forEach((x, index) => {
                        try {
                            const x_question = questions.filter(elem => elem.id === x);
                            if (x_question.length > 0)
                                sortedQuestions.push(questions.filter(elem => elem.id === x)[0])
                            else if (index <= currentIndex)
                                currentIndex -= 1;
                        } catch (e) {
                            console.log(e)
                        }
                    })
                    if (sortedQuestions.length > 0)
                        sortedQuestions[0].answers.forEach(() => checked.push(false))
                    this.setState({
                        questions: sortedQuestions,
                        currentIndex: currentIndex,
                        currentScore: savedState.currentScore,
                        checked: checked,
                        loading: false
                    })
                } else {
                    if (questions.length > 0)
                        questions[0].answers.forEach(() => checked.push(false))
                    this.setState({
                        questions: data.data,
                        checked: checked,
                        loading: false
                    })
                }
            })
    }
    shuffle = (a) => {
        let temp, j;
        for (let i = a.length - 1; i > 0; i--) {
            j = Math.floor(Math.random() * (i + 1));
            temp = a[i];
            a[i] = a[j];
            a[j] = temp;
        }
        return a;
    }
    shuffleClick = () => {
        let {questions} = this.state
        for (let i = 0; i < questions.length; i++) {
            questions[i].answers = this.shuffle(questions[i].answers)
        }
        questions = this.shuffle(questions)
        const checked = []
        questions[0].answers.forEach(() => checked.push(false))
        this.setState({
            questions: questions,
            currentIndex: 0,
            checked: checked,
            isChecked: false,
            isRight: false,
            isCurrentRight: false,
            currentScore: 0
        })
    }

    componentDidMount() {
        this.loadQuestions();
    }

    render() {
        const question = this.state.questions.length > 0 ? this.state.questions[this.state.currentIndex] : null;
        return this.state.loading ?
            <div style={{marginTop: '100px', textAlign: 'center'}}>
                <div className="lds-ring">
                    <div/>
                    <div/>
                    <div/>
                    <div/>
                </div>
            </div> : this.state.questions.length > 0 ?
                <div className={'panel-content'} style={{paddingBottom: '15px'}}>
                    {this.state.currentIndex < this.state.questions.length ?
                        <div className={'question-content'}>
                            {this.state.currentIndex === 0 && <span style={{
                                borderBottom: '1px solid green',
                                marginBottom: '10px',
                                color: 'green',
                                cursor: 'pointer',
                            }} onClick={this.shuffleClick}>Перемешать всё</span>}
                            {this.state.currentIndex !== 0 ?
                                <span style={{
                                    borderBottom: '1px solid green',
                                    color: 'green',
                                    cursor: 'pointer',
                                    marginBottom: '10px',
                                }} onClick={this.newClick}>Обнулить всё</span> : null}
                            <div>{this.state.currentIndex + 1}/{this.state.questions.length}</div>
                            {this.state.currentIndex !== 0 ?
                                <div style={{backgroundColor: 'cornflowerblue', color: 'white', padding: '5px 30px', margin: '5px 0', borderRadius: '5px'}}>
                                    Решено правильно {!this.state.isChecked || !this.state.isRight ? this.state.currentScore : this.state.currentScore + 1}; {' '}
                                    {!this.state.isChecked
                                        ? Math.round(100 * 100 * this.state.currentScore / (this.state.currentIndex)) / 100
                                        : this.state.isRight ? Math.round(100 * 100 * (this.state.currentScore + 1) / (this.state.currentIndex + 1)) / 100
                                            : Math.round(100 * 100 * (this.state.currentScore) / (this.state.currentIndex + 1)) / 100}%</div>
                                : null}
                            <div className={'question-text'} style={{textAlign: 'center', whiteSpace: 'pre-wrap'}}
                                 dangerouslySetInnerHTML={{__html: question.text}}>
                            </div>
                            <div className={'answers'}>
                                {question.answers.map((elem, index) => {
                                    if (question.type === 'radio') {
                                        return <label className={'answer'}
                                                      style={{display: 'flex'}}><input
                                            type={'radio'}
                                            checked={this.state.checked[index]}
                                            name={index}
                                            onChange={this.handleChange}/>
                                            <div style={{maxWidth: '90%', wordBreak: 'break-word', whiteSpace: 'pre-wrap'}}
                                                 dangerouslySetInnerHTML={{__html: elem.text}}/>
                                        </label>
                                    } else if (question.type === 'checkbox') {
                                        return <label
                                            className={'answer'} style={{display: 'flex'}}><input
                                            type={'checkbox'}
                                            name={index}
                                            checked={this.state.checked[index]}
                                            onChange={this.handleChange}/>
                                            <div style={{maxWidth: '90%', wordBreak: 'break-word', whiteSpace: 'pre-wrap'}}
                                                 dangerouslySetInnerHTML={{__html: elem.text}}/>
                                        </label>
                                    } else if (question.type === 'text') {
                                        return <div className={'answer'}
                                                    style={{wordBreak: 'break-word', whiteSpace: 'pre-wrap'}}
                                                    dangerouslySetInnerHTML={{__html: elem.text}}/>
                                    } else if (question.type === 'input') {
                                        return <div className={'input'}>
                                            <input type={'text'} name={index}
                                                   placeholder={'Введите ответ'}
                                                   autoComplete={'off'}
                                                   value={this.state.currentInputAnswer}
                                                   onChange={this.handleChange}/>
                                        </div>
                                    } else return '';
                                })}
                            </div>
                            {this.state.isChecked ?
                                <div className={'alert-panel-content'} style={{
                                    backgroundColor: this.state.isCurrentRight ? 'rgba(132, 181, 105, 0.5)' : 'rgba(227, 89, 89, 0.5)',
                                    color: this.state.isCurrentRight ? 'green' : 'red'
                                }}>
                                    <div>{this.state.isCurrentRight ? "Верно" : "Неверно"}</div>
                                    {!this.state.isCurrentRight ? (question.type !== 'input' ?
                                        <div>Верные варианты: {question.answers.map((x, index) => {
                                            return (x.right ? index + 1 : '') + " "
                                        })}</div> :
                                        <div>Верный ответ: {question.answers[0].text}</div>) : null}
                                </div>
                                : null}
                            <div className={'button-bar'}>
                                {question.type === 'text' ? null :
                                    <button className={'clear-button check-button'}
                                            onClick={this.checkClick}>Проверить</button>
                                }
                                <button className={'clear-button next-button'}
                                        onClick={this.nextClick}>Далее
                                </button>
                            </div>
                        </div>
                        : <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            paddingTop: '100px'
                        }}>
                            <div>Правильных ответов {this.state.currentScore}</div>
                            <div>Процент
                                выполнения {Math.round(100 * this.state.currentScore / this.state.questions.length * 100) / 100}</div>
                            <button className={'clear-button next-button'}
                                    style={{marginTop: '30px'}}
                                    onClick={this.newClick}>Заново
                            </button>
                        </div>}
                </div> : <div className={'panel-content'}
                              style={{marginTop: '100px', textAlign: 'center'}}>Еще нет ни одного
                    вопроса</div>
    }
}
