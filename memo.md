2 buttons
- Assignments (Red)
- Uses (Blue)
Highlight keywords with the corresponding color

そのラインを抜き出す
- ;があったらストップ (;はspanに入っていないし、下手したら()と同じところにくくられている可能性)
- \があったらその次の行も (<span class="cm-error">\</span>)
- 改行なら\がなければストップ

ただし、(や[の後は要注意（そいつもちゃんとラインに入れる）

- :は厄介。ifとかなら続けたら困るし、{a: b}なら欲しい。
- :があったら続けないと決めると、どのような弊害が起きるか。
```python
array = {
	'key':
	'value',
	'key':
	something
}
```

```python
something = {
	'key':
	'value'
}
```
特に弊害は起きないのでは。前者は、まず=に到達しないのでassignmentではないと判断される。後者では、=は認識され、somethingが一番外側にあるということも認識できるので、assignmentであると判断できる。

もしくは、variableの場合は後方しか確認しなければどうか。もし=があれば、それまでのところで[]と{}が全て対応するか確認する。対応すればassignmentである。

```python
something, {'a':
	'b'}['a'] = 1, 2
```

後方しか見ないとして、基本的に:は無視するとしても、閉じられていない{があれば:は次の行に続くとして認識する。
しかし、

```python
{something:
	'a'}[something] = 'b'
```

といったstatementでは:を無視することになるが、それでは=の存在も知らないままなのでassignmentではないと判断できる。

やっぱり無理。cellの初めから解析しなければ不可能。

```python
(
    hahaha,
    something \
, array[0]
) \
= ('haha', 'a', 2)
```

これとか、array[0]から次に行くかどうかは(の存在を知っていなければならないが、somethingの場所から始めたらその存在は知らないまま。

一つのcellに対して何度も解析するのはもったいないので、line breakで区切ったspanをarrayとして保存するくらいはしよう。

# Steps

0.

<div class="code_cell"> (contains output) <-> "text_cell" (Markdown)
	...
	<div class="CodeMirror-code"> <- cell
		<pre class="CodeMirror-line"> <- line
			<span>
				<span class="cm-keyword"></span>
				<span class="cm-variable"></span>
			</span>
		</pre>
	</div>
	...
</div>

1. When a text is selected, check if it is an independent variable. If it is the whole content of a single <span> and its class is "cm-def" or "cm-variable" or "cm-property", go to the next step.

2. Collect all the spans that contain <span> with class "cm-def", "cm-variable", or "cm-property" and with the identical text content.

3. Categorize it as either class, function, or variable.

if 2 contains "cm-def" -> either class, function, or method

else, it's a variable.

4. Classify the spans collected in step 2 as either "definition" or "reference".

How??

自分（独立したkeyword）がvariableのassignmentであるかどうか
- 自分が一番外側にいる(かっこ([, {)が自分の前か後ろで完結している) (parenthesisはあってもいい)
	&& 自分の後にcm-stringに入っていない=がある
	&& その=は==だったり<=だったり(cm-operator(<, >, !)に後続したり)しない

injectionされる恐れはないのか？

()を探すとき、決してspanに入っていないと決めつけてはならない。緑にハイライトされているときはspanに入っているから。

# UI

## Syntax Highlighting

CodeMirror's default syntax colors are defined in ```/user/???/static/components/codemirror/lib/codemirror.css```. In Jupyter Notebook, this style is only applied to the Markdown cells (tabun??). Code cells use a style defined in ```/user/???/static/style/style.min.css```.

# Problems

- numpyとかのdestructiveなreassignmentには対応していない
- cm-propertyを選択されたとき、その定義はcm-variableではあり得ないし、cm-defの中でもclass内で定義されたものでなければならないが、それは無視