// @flow

/*
Let's start with some simpler type definitions. To keep things simple, we will
only attempt to support "pure functional components". Fortunately, it is very easy
to write the type definition for a pure functional component.

A pure functional component if just a function that takes some props of generic
type Props and returns a react element or null. Or as stated with flowtype:
*/
type FunctionalComponent<Props> = (props:Props) => React$Element<*>|null;


/*
Next we need to come up with a reasonable definition of a "higher-order component"
or HOC for short.

Simply stated, an HOC is just a function which takes an existing functional component,
we'll call it the "first-order component", and returns
a *new* functional component.

The more complicated question comes with the prop types for both the first-order component
that gets passed in as an argument and the new functional component that gets returned.

The component that gets passed in, which is a "first-order componet" takes some
props, which we will call the "first-order props". These props have the generic
type FirstOrderProps.

The component that gets returned could have a completely different set of props. We
will call the props that the new component takes the "HOC props". These props are
of generic type HOCProps.
*/

type HOC<FirstOrderProps, HOCProps> = (firstOrderComponent: FunctionalComponent<FirstOrderProps>) => FunctionalComponent<HOCProps>;

/*
Now, higher-order components are great, but often times we want to create higher
order components on the fly from some configuration. We'll call the functions
that do this "higher-order component factories".

So to restate this, we can say that a higher-order component factory is just a
function which takes come configuration with generic type Config, and returns a
higher-order component:
*/

type HOCFactory<FirstOrderProps, HOCProps, Config> = (config:Config) => HOC<FirstOrderProps, HOCProps>

/*
These three types form the foundation of our functional component type system.

They are however a bit simplistic. So lets go ahead and define some more complex
types for advanced use cases. Higher-order components fit into four categories
with respect to their prop types:

1. "Neutral" higher-order components: This is where HOCProps is the same as FirstOrderProps
2. "Additive" higher-order components: This is where HOCProps is a superset of FirstOrderProps
3. "Subtractive" higher-order components: This is where HOCProps is a subset of FirstOrderProps
4. "Complicated" higher-order components: This is where HOCProps and FirstOrderProps partially intersect

We will try to define types for each of these different types higher-order components.

1. "Neutral": this one is easy...
*/

type NeutralHOC<FirstOrderProps> = HOC<FirstOrderProps, FirstOrderProps>

/*
2. "Additive" higher-order components: HOCProps is a superset of FirstOrderProps,
or in other words, the functional component returned by the higher order component
requires *more* props than what is in the first-order component. We can say that
these additional props have the generic type AdditionalProps, which means that
HOCProps is the "intersection" of the props in FirstOrderProps and the props
in AdditionalProps. In flowtype, the intersection of two types can be expressed
using the & operator. (See https://flowtype.org/docs/union-intersection-types.html)

With this information, we can define the AdditiveHOC type as:
*/
type AdditiveHOC<FirstOrderProps, AdditionalProps> = HOC<FirstOrderProps, FirstOrderProps&AdditionalProps>

/*
3. "Subtractive" higher-order components: HOCProps is a subset of FirstOrderProps,
or in other words, the functional component returned by the higher order component
requires *fewer* props than what is in the first-order component. We might say that
the props to be removed from FirstOrderProps are "provided" by the higher-order
component, so we'll call them "provided props" and say they have a generic type
"ProvidedProps".

This implies that HOCProps is the set of props you get by subtracting ProvidedProps
from FirstOrderProps. flowtype has a way of declaring this relationship, though
it is not officially documented. You can find unofficial documentation
here: http://sitr.us/2015/05/31/advanced-features-in-flow.html#diffab.

In short, a subtraction of properties in B from type A is defined as $Diff<A,B>.

Thus we can define the type for SubtractiveHOC as:
*/

type SubtractiveHOC<FirstOrderProps, ProvidedProps> = HOC<FirstOrderProps, $Diff<FirstOrderProps, ProvidedProps>>

/*
4. Finally, we have "Complicated" higher-order components, which are just a combination
of the "additive" and "subtractive types". As such there are three different prop types
we are interested in: FirstOrderProps, AdditionalProps, and ProvidedProps.
Using the same operators as above, we can define the ComplicatedHOC type as:
*/
type ComplicatedHOC<FirstOrderProps, AdditionalProps, ProvidedProps> = HOC<FirstOrderProps, AdditionalProps&$Diff<FirstOrderProps, ProvidedProps>>

/*
Note that the ComplicatedHOC type can actually be used to define all the other
HOC types. We will leave them commented out so as not to conflict with our
previous type definitions:
*/
// type NeutralHOC<FirstOrderProps> = ComplicatedHOC<FirstOrderProps, {}, {}>
// type AdditiveHOC<FirstOrderProps, AdditionalProps> = ComplicatedHOC<FirstOrderProps, AdditionalProps, {}>
// type SubtractiveHOC<FirstOrderProps, ProvidedProps> = ComplicatedHOC<FirstOrderProps, {}, ProvidedProps>


/*
While we are at it, we should go ahead and define corresponding factory types for
each of these
*/

type NeutralHOCFactory<FirstOrderProps, Config> = (config:Config) => NeutralHOC<FirstOrderProps>
type AdditiveHOCFactory<FirstOrderProps, AdditionalProps, Config> = (config:Config) => AdditiveHOC<FirstOrderProps, AdditionalProps>
type SubtractiveHOCFactory<FirstOrderProps, ProvidedProps, Config> = (config:Config) => SubtractiveHOC<FirstOrderProps, ProvidedProps>
type ComplicatedHOCFactory<FirstOrderProps, AdditionalProps, ProvidedProps, Config> = (config:Config) => ComplicatedHOC<FirstOrderProps, AdditionalProps, ProvidedProps>

/*
Just like with the HOC types themslves, we can define all the factories in terms of
the ComplicatedHOCFactory type. Again we will leave thease commented out to avoid
conflicting with the existing type definitions.
*/
// type NeutralHOCFactory<FirstOrderProps, Config> = ComplicatedHOCFactory<FirstOrderProps, {}, {}, Config>
// type AdditiveHOCFactory<FirstOrderProps, AdditionalProps, Config> = ComplicatedHOCFactory<FirstOrderProps, AdditionalProps, {}, Config>
// type SubtractiveHOCFactory<FirstOrderProps, ProvidedProps, Config> = ComplicatedHOCFactory<FirstOrderProps, {}, ProvidedProps, Config>

/*
With these types in place, we should be able to define any type of higher order
component or factory we want and have everything type check all the way through!

To facilitate our exploration of higher order components and factories, let's
define a few simple functional components that takes a few props and
render some stuff:
*/
type ProfileProps = {username:string, onEdit:Function}
function Profile(props:{username:string, onEdit:Function}) {
  return (
    <div>
      Your Username: {props.username}
      <button onClick={props.onEdit}>Edit Profile</button>
    </div>
  );
}

function Friends(props:{friends:Array<{username:string}>}) {
  return (
    <ul>
      {props.friends.map(username => <li>{username}</li>)}
    </ul>
  );
}

/*
First we will define a neutral higher order component. All it does is log the
props to the console whenever the first order component is rendered:
*/

function logOnRender<FirstOrderProps>(FirstOrderComponent:FunctionalComponent<FirstOrderProps>):FunctionalComponent<FirstOrderProps> {
  return function NewComponent(firstOrderProps:FirstOrderProps) {
    console.log("Rendering with props:", firstOrderProps);
    return <FirstOrderComponent {...firstOrderProps}/>;
  }
}

/*
Using this with our components, we can quickly create new
components with logging:
*/

const LoggedProfile = logOnRender(Profile);
const LoggedFriends = logOnRender(Friends);

/*
When we use the LoggedProfile component, flow will type check the props
we pass to it.
*/

const badProfile = (
  <LoggedProfile
    username={1234}
    onEdit={"not implemented yet"}
  />
);

const goodProfile = (
  <LoggedProfile
    username={"pcardune"}
    onEdit={() => console.log("not implemented yet")}
  />
);

/*
let's make this more interesting by creating a NeutralHOCFactory that produces
higher-order components with a preconfigured message:
*/

function logMessageOnRender<FirstOrderProps>(message:string):NeutralHOC<FirstOrderProps> {
  return function neutralHOC(FirstOrderComponent:FunctionalComponent<FirstOrderProps>):FunctionalComponent<FirstOrderProps> {
    return function NewComponent(firstOrderProps:FirstOrderProps) {
      console.log(message, firstOrderProps);
      return <FirstOrderComponent {...firstOrderProps}/>;
    }
  }
}

const LoggedMessageProfile = logMessageOnRender("Rendering Profile")(Profile);
const LoggedMessageFriends = logMessageOnRender("Rendering Friends")(Friends);

const badMessageProfile = (
  <LoggedMessageProfile
    username={1234}
    onEdit={"not implemented yet"}
  />
);

const goodMessageProfile = (
  <LoggedMessageProfile
    username={"pcardune"}
    onEdit={() => console.log("not implemented yet")}
  />
);

/*
Now that we've explored neutral HOCs, let's play around with additive
ones. We'll start by creating an additive HOC component that will hide a component
when a hide={true} prop is provided.
*/
type HideableProps = {hide:boolean};
function hideable<FirstOrderProps>(FirstOrderComponent:FunctionalComponent<FirstOrderProps>):FunctionalComponent<FirstOrderProps&HideableProps>{
  return function NewComponent(propsWithHide:FirstOrderProps&HideableProps) {
    if (propsWithHide.hide) {
      return null;
    }
    const firstOrderProps:FirstOrderProps = propsWithHide;
    return <FirstOrderComponent {...firstOrderProps}/>;
  }
}

const makeHideableProfile:AdditiveHOC<{username:string, onEdit:Function}, {hide:boolean}> = hideable;

const HideableProfile:FunctionalComponent<ProfileProps&HideableProps> = hideable(Profile);
const HideableFriends = hideable(Friends);

const badHideableProfile = (
  <LoggedMessageProfile
    username={"pcardune"}
    onEdit={() => console.log("not implemented yet")}
    hide="yes"
  />
);

const goodHideableProfile = (
  <LoggedMessageProfile
    username={"pcardune"}
    onEdit={() => console.log("not implemented yet")}
    hide={true}
  />
);
