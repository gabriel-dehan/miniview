# MiniView

A javascript library to ease the creation of Views.

## Dependencies

Depends on `jQuery`, `Underscore` and `Stampit`.
See `vendor/` directory.

## Create a view

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
     },
    insert: [
      { template: 'answers-types', into: '.answers-types' },
      // { template: '...', into: '...' }
    ],
    events: {
      'keyup .question-label, change .question-label: function(e) {
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
