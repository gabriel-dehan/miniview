# MiniView

A javascript library to ease the creation of Views.

## Dependencies

Depends on `jQuery`, `Underscore` and `Stampit`.
See `vendor/` directory.

## Create a view

We use `MiniView.Extend();` to create a view. Read the [documentation](https://github.com/gabriel-dehan/miniview/blob/master/miniview.js#L8).
A view has a `state`, a `init` constructor function, `events`, `methods` which are helpers accessible everywhere in the view (not the template!) and `insert`s which are declarative partials insertions.

## Methods

Inside your `MiniView` methods or events handler and the `init` constructor function you have access to a few methods to help you along your way.

- `render()`, renders a subview. [render documentation](https://github.com/gabriel-dehan/miniview/blob/master/miniview.js#L133).
- `destroy()`, destroys a rendered element or subview. [destroy documentation](https://github.com/gabriel-dehan/miniview/blob/master/miniview.js#L182).
- `refreshView`, like `render` but for all views declared through the `insert` property. [source code](https://github.com/gabriel-dehan/miniview/blob/master/miniview.js#L117)
- `destroyView`, like `destroy` but for all views declared through the `insert` property. [source code](https://github.com/gabriel-dehan/miniview/blob/master/miniview.js#L123)
- `attachEvents`, sets all the events, is called once when rendering the view the first time. [source code](https://github.com/gabriel-dehan/miniview/blob/master/miniview.js#L238)
- `detachEvents`, unsets all the events, is called automaticaly when destroying the view. [source code](https://github.com/gabriel-dehan/miniview/blob/master/miniview.js#L257)

## Simple example

```html
<div id="questionnaire">
  <h1>Here is your questionnaire</h1>
  <div class="questions-container"></div>
  <div class="answers-types"></div>
</div>

<script type="text/html" data-template="answers-types">
  <select name="questions-types">
    <options>...</options>
  </select>
</script>

<script type="text/html" data-template="question-card">
  <# if (question.isNew()) { #>
    <input type="text" name="question-label" class="question-label">
  <# } else { #>
    <h1><#= question.label #></h1>
  <# } #>
</script>

```

```javascript
   MyView = MiniView.extend({
     init: function(props) {
       this.state.collections = props.collection;
       console.log(this.state); // Data passed onto the subviews on rendering.
       this.renderQuestions();
},
    insert: [
      { template: 'answers-types', into: '.answers-types' },
      // { template: '...', into: '...' }
    ],
    events: {
      'keyup .question-label, change .question-label': function(e) {
         // Do something, the context is still the MiniView instance
         console.log(this.state);
      }
    },
    state: {
      questions: [],
      answers: [],
      maximum_questions: 10
    },
    methods: {
      renderQuestions: function() {
        _.each(this.state.collection, function(question) {
          this.render({
            template: 'question-card', // Should be a script with data-template
            into: '.questions-container',
            method: 'append', // 'html' || 'prepend' || 'append'
            data: question // If none given, state is passed as data
          });
        }, this);
      }
    }
   });

   var questionnaireView = MyView("#questionnaire", { collection: Questions });
```

## Real world example

This is a real world example where we have a Questionnaire containing multiple questions of type Multiple Choice Questions and such.
In this example we have a `question form` which allows us to create a new question. We needed a way to add possible answers using javacript to generate the form's html when the `question type` is selected.

Questions can be either `Multiple Choice Questions (mcq)`, `Single Choice Questions (scq)`, `Text Questions (text)` or `Datetime Questions (datetime)`.

```erb
<form id="question-form-1" action="..." method="post"> <!-- Could be question-form-2, imagine a loop -->
  <div class="panel panel-default">
    <h3 class="panel-heading">
      <input type="text" name="question[label]" class="question-label">
    </h3>
    <div class="panel-body">
      <strong class="type">
        <select name="question[type]" class="question-type">
          <option value="">Chose a type</option>
          <option value="mcq">Multiple Choice Question</option>
          <option value="scq">Single Choice Question</option>
          <option value="text">Text Question</option>
          <option value="datetime">Datetime Question</option>
        </select>
      </strong>
      <div class="question-answers"><!-- handled by javascript QuestionView --></div>
      <input type="submit" class="action-submit">
    </div>
  </div>
</form>

<script type="text/html" data-template="answers-for-type">
  <ul class="answers">
    <# _.each(answers, function(answer, index) { #>
      <!-- We don't display answer that were just removed -->
      <li class="answer <#= answer.state === 'deleted' ? 'hide' : '' #>">
        <!-- Stores the ID when we want to update/delete -->
        <input type="hidden" name="answers[][id]" value="<#= answer.id #>">
        <!-- State is either initial, modified, deleted or created  -->
        <input type="hidden" name="answers[][state]" value="<#= answer.state #>">

        <# if(type === "mcq" || type === "scq") { #>
          <input type="text" data-id="<#= index #>" class="answer-input" name="answers[][label]" placeholder="Enter a possible answer." value="<#= answer.label #>">
          <a href="#" class="remove-answer" data-answer="<#= index #>">
            <i class="fa fa-cross"></i>
            <span class="action-label">
              Delete
            </span>
          </a>
        <# } else if(type === "datetime") { #>
          <input type="date" data-id="<#= index #>" class="answer-input" name="answers[][label]" disabled>
        <# } else { #>
          <input type="text"  data-id="<#= index #>" class="answer-input" name="answers[][label]" disabled>
        <# } #> <!-- /if type -->
      </li>
    <# }); #> <!-- /each answers -->
  </ul>

  <# if(type === "mcq" || type === "scq") { #>
    <a href="#" class="add-answer">
      <i class="fa fa-plus"></i>
      <span class="action-label">
        Add an answer
      </span>
    </a>
  <# } #>
</script>


<script type="text/javascript">

// In a loop
var answers = array_of_objects;
var type    = "mcq"; // or "scq" or "text" or "datetime" or null if new question

QuestionView("#question-form-1", { type: type, answers: answers });

var answers = [];
var type    = null; // or "scq" or "mcq" or "text" or "datetime" if not a new question

QuestionView("#question-form-2", { type: type, answers: answers });

</script>

```

```javascript
/*
 * QuestionView: Instanciated for all Questions edition or creation.
 *               Is attached to a form.
 */
var QuestionView = MiniView.extend({
  state: {
    type: '',
    answers: [],
    minimum_answers: 0
  },
  init: function(props) {
    this.state.type    = props.type || ''; // Just to be sure
    this.state.answers = props.answers || []; // Just to be sure
    this.state.answers = _.map(answers, function(o) { return new Answer(o) });
  },
  insert: [
    { template: 'answers-for-type', into: '.question-answers' }
  ],
  events: {
    'change .question-type': function(e) {
      this.state.type = $(e.currentTarget).val();

      // We always have at least one field
      this.state.answers = [Answer.createEmpty()]

      if (this.isMcqOrScq()) {
        this.state.minimum_answers = 2;
        this.state.answers = [Answer.createEmpty(), Answer.createEmpty()];
      }

      this.refreshView();
    },
    'keyup .answer-input, change .answer-input': function(e) {
      var index = $(e.currentTarget).data('id');
      var value = $(e.currentTarget).val();
      this.state.answers[index].set('label', value);
    },
    'click .add-answer': function(e) {
      e.preventDefault();
      this.state.answers.push(Answer.createEmpty());
      this.refreshView();
    },
    'click .remove-answer': function(e) {
      e.preventDefault();
      // If we are not trying to remove more answer than the minimum allowed
      if (this.answersCount() > this.state.minimum_answers) {
        var index = $(e.currentTarget).data('answer');
        this.state.answers[index].set('state', 'deleted');
        this.refreshView();
      }
    },
    'submit': function(e) {
      // Reload the view to make sure every field is up to date before submit
      this.refreshView();

      // We check if the label is not empty
      if (_.isEmpty(this.$('[name="question[label]"]').val())) {
        return false;
      // We check if the type is not null or empty
      } else if (_.isNull(this.state.type) || _.isEmpty(this.state.type)) {
        return false;
      // We check if the answers' labels are not empty
      } else if (this.isMcqOrScq()) {
        blank_answer = _.find(this.state.answers, function(answer) {
          return _.isEmpty(answer.label);
        });
        return _.isUndefined(blank_answer);
      }

      return true;
    }
  },
  methods: {
    isMcqOrScq: function() {
      return _.contains(["mcq", "scq"], this.state.type);
    },
    answersCount: function() {
      return _.reject(this.state.answers, function(answer){
        return answer.state === 'deleted';
      }).length;
    }
  }
})

```

```javascript
/*
 * Answer object, simple data store with convenience helpers
 */
var Answer = (function(props) {
  var self = this;

  this._props = props || {};

  this.id    = this._props.id || null;
  this.label = this._props.label || '';
  this.state = this._props.state || 'initial';


  // Setter, modifies the state accordingly
  this.set = (function(prop, value) {
    self[prop] = value;

    if (self['state'] === 'initial') {
      self['state'] = 'modified'
    }
  });

  // Getter, is useless but goes with the setter
  this.get = (function(prop) {
    return self[prop];
  });
});

Answer.createEmpty = (function() {
  return new Answer({ state: 'created' })
});

```

## License

WTFPL
